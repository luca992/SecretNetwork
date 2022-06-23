package cosmwasm

import (
	"encoding/json"
	"fmt"

	"github.com/enigmampc/SecretNetwork/go-cosmwasm/api"
	types "github.com/enigmampc/SecretNetwork/go-cosmwasm/types"
	v010types "github.com/enigmampc/SecretNetwork/go-cosmwasm/types/v010"
	v1types "github.com/enigmampc/SecretNetwork/go-cosmwasm/types/v1"
)

// CodeID represents an ID for a given wasm code blob, must be generated from this library
type CodeID []byte

// WasmCode is an alias for raw bytes of the wasm compiled code
type WasmCode []byte

// KVStore is a reference to some sub-kvstore that is valid for one instance of a code
type KVStore = api.KVStore

// GoAPI is a reference to some "precompiles", go callbacks
type GoAPI = api.GoAPI

// Querier lets us make read-only queries on other modules
type Querier = types.Querier

// GasMeter is a read-only version of the sdk gas meter
type GasMeter = api.GasMeter

// Wasmer is the main entry point to this library.
// You should create an instance with it's own subdirectory to manage state inside,
// and call it for all cosmwasm code related actions.
type Wasmer struct {
	cache api.Cache
}

// NewWasmer creates an new binding, with the given dataDir where
// it can store raw wasm and the pre-compile cache.
// cacheSize sets the size of an optional in-memory LRU cache for prepared VMs.
// They allow popular contracts to be executed very rapidly (no loading overhead),
// but require ~32-64MB each in memory usage.
func NewWasmer(dataDir string, supportedFeatures string, cacheSize uint64, ModuleCacheSize uint8) (*Wasmer, error) {
	cache, err := api.InitCache(dataDir, supportedFeatures, cacheSize)
	if err != nil {
		return nil, err
	}
	err = api.InitEnclaveRuntime(ModuleCacheSize)
	if err != nil {
		return nil, err
	}

	return &Wasmer{cache: cache}, nil
}

// Cleanup should be called when no longer using this to free resources on the rust-side
func (w *Wasmer) Cleanup() {
	api.ReleaseCache(w.cache)
}

// Create will compile the wasm code, and store the resulting pre-compile
// as well as the original code. Both can be referenced later via CodeID
// This must be done one time for given code, after which it can be
// instatitated many times, and each instance called many times.
//
// For example, the code for all ERC-20 contracts should be the same.
// This function stores the code for that contract only once, but it can
// be instantiated with custom inputs in the future.
//
// TODO: return gas cost? Add gas limit??? there is no metering here...
func (w *Wasmer) Create(code WasmCode) (CodeID, error) {
	return api.Create(w.cache, code)
}

// GetCode will load the original wasm code for the given code id.
// This will only succeed if that code id was previously returned from
// a call to Create.
//
// This can be used so that the (short) code id (hash) is stored in the iavl tree
// and the larger binary blobs (wasm and pre-compiles) are all managed by the
// rust library
func (w *Wasmer) GetCode(code CodeID) (WasmCode, error) {
	return api.GetCode(w.cache, code)
}

// This struct helps us to distinguish between v010 contract response and v1 contract response
type V010orV1ContractResponse struct {
	V1Ok                   *v1types.Response         `json:"ok,omitempty"`
	V1Err                  string                    `json:"error,omitempty"`
	V010Ok                 *v010types.HandleResponse `json:"Ok,omitempty"`
	V010Err                *types.StdError           `json:"Err,omitempty"`
	InternaReplyEnclaveSig []byte                    `json:"internal_reply_enclave_sig"`
	InternalMsgId          []byte                    `json:"internal_msg_id"`
}

type V010orV1ContractInitResponse struct {
	V1Ok                   *v1types.Response       `json:"ok,omitempty"`
	V1Err                  string                  `json:"error,omitempty"`
	V010Ok                 *v010types.InitResponse `json:"Ok,omitempty"`
	V010Err                *types.StdError         `json:"Err,omitempty"`
	InternaReplyEnclaveSig []byte                  `json:"internal_reply_enclave_sig"`
	InternalMsgId          []byte                  `json:"internal_msg_id"`
}

// Instantiate will create a new contract based on the given codeID.
// We can set the initMsg (contract "genesis") here, and it then receives
// an account and address and can be invoked (Execute) many times.
//
// Storage should be set with a PrefixedKVStore that this code can safely access.
//
// Under the hood, we may recompile the wasm, use a cached native compile, or even use a cached instance
// for performance.
func (w *Wasmer) Instantiate(
	codeId CodeID,
	env types.Env,
	initMsg []byte,
	store KVStore,
	goapi GoAPI,
	querier Querier,
	gasMeter GasMeter,
	gasLimit uint64,
	sigInfo types.VerificationInfo,
) (interface{}, []byte, uint64, error) {
	paramBin, err := json.Marshal(env)
	if err != nil {
		return nil, nil, 0, err
	}

	sigInfoBin, err := json.Marshal(sigInfo)
	if err != nil {
		return nil, nil, 0, err
	}

	data, gasUsed, err := api.Instantiate(w.cache, codeId, paramBin, initMsg, &gasMeter, store, &goapi, &querier, gasLimit, sigInfoBin)
	if err != nil {
		return nil, nil, gasUsed, err
	}

	key := data[0:64]
	data = data[64:]

	var respV010orV1 V010orV1ContractInitResponse
	err = json.Unmarshal(data, &respV010orV1)

	if err != nil {
		// unidentified response 🤷
		return nil, nil, gasUsed, fmt.Errorf("handle: cannot parse response from json: %w", err)
	}

	isOutputAddressedToReply := (len(respV010orV1.InternaReplyEnclaveSig) > 0 && len(respV010orV1.InternalMsgId) > 0)

	if respV010orV1.V1Err != "" {
		return nil, nil, gasUsed, fmt.Errorf(respV010orV1.V1Err)
	}

	if respV010orV1.V1Ok != nil {
		if isOutputAddressedToReply {
			respV010orV1.V1Ok.Data, err = AppendReplyInternalDataToData(respV010orV1.V1Ok.Data, respV010orV1.InternaReplyEnclaveSig, respV010orV1.InternalMsgId)
			if err != nil {
				return nil, nil, gasUsed, fmt.Errorf("cannot serialize v1 DataWithInternalReplyInfo into binary : %w", err)
			}
		}
		return respV010orV1.V1Ok, key, gasUsed, nil
	}

	if respV010orV1.V010Err != nil {
		return nil, nil, gasUsed, fmt.Errorf("%+v", respV010orV1.V010Err)
	}

	if respV010orV1.V010Ok != nil {
		if isOutputAddressedToReply {
			respV010orV1.V1Ok.Data, err = AppendReplyInternalDataToData(respV010orV1.V1Ok.Data, respV010orV1.InternaReplyEnclaveSig, respV010orV1.InternalMsgId)
			if err != nil {
				return nil, nil, gasUsed, fmt.Errorf("cannot serialize v1 DataWithInternalReplyInfo into binary : %w", err)
			}
		}
		return respV010orV1.V010Ok, key, gasUsed, nil
	}

	return nil, nil, gasUsed, fmt.Errorf("handle: cannot detect response type (v0.10 or v1): %w", err)
}

func AppendReplyInternalDataToData(data []byte, internaReplyEnclaveSig []byte, internalMsgId []byte) ([]byte, error) {
	dataWithInternalReply := v1types.DataWithInternalReplyInfo{
		InternaReplyEnclaveSig: internaReplyEnclaveSig,
		InternalMsgId:          internalMsgId,
		Data:                   data,
	}

	return json.Marshal(dataWithInternalReply)
}

// Execute calls a given contract. Since the only difference between contracts with the same CodeID is the
// data in their local storage, and their address in the outside world, we need no ContractID here.
// (That is a detail for the external, sdk-facing, side).
//
// The caller is responsible for passing the correct `store` (which must have been initialized exactly once),
// and setting the env with relevent info on this instance (address, balance, etc)
func (w *Wasmer) Execute(
	code CodeID,
	env types.Env,
	executeMsg []byte,
	store KVStore,
	goapi GoAPI,
	querier Querier,
	gasMeter GasMeter,
	gasLimit uint64,
	sigInfo types.VerificationInfo,
	handleType types.HandleType,
) (interface{}, uint64, error) {
	paramBin, err := json.Marshal(env)
	if err != nil {
		return nil, 0, err
	}
	sigInfoBin, err := json.Marshal(sigInfo)
	if err != nil {
		return nil, 0, err
	}

	data, gasUsed, err := api.Handle(w.cache, code, paramBin, executeMsg, &gasMeter, store, &goapi, &querier, gasLimit, sigInfoBin, handleType)
	if err != nil {
		return nil, gasUsed, err
	}

	var respV010orV1 V010orV1ContractResponse
	err = json.Unmarshal(data, &respV010orV1)

	if err != nil {
		// unidentified response 🤷
		return nil, gasUsed, fmt.Errorf("handle: cannot parse response from json: %w", err)
	}

	isOutputAddressedToReply := (len(respV010orV1.InternaReplyEnclaveSig) > 0 && len(respV010orV1.InternalMsgId) > 0)

	if respV010orV1.V1Err != "" {
		return nil, gasUsed, fmt.Errorf(respV010orV1.V1Err)
	}

	if respV010orV1.V1Ok != nil {
		if isOutputAddressedToReply {
			respV010orV1.V1Ok.Data, err = AppendReplyInternalDataToData(respV010orV1.V1Ok.Data, respV010orV1.InternaReplyEnclaveSig, respV010orV1.InternalMsgId)
			if err != nil {
				return nil, gasUsed, fmt.Errorf("cannot serialize v1 DataWithInternalReplyInfo into binary : %w", err)
			}
		}
		return respV010orV1.V1Ok, gasUsed, nil
	}

	if respV010orV1.V010Err != nil {
		return nil, gasUsed, fmt.Errorf("%+v", respV010orV1.V010Err)
	}

	if respV010orV1.V010Ok != nil {
		if isOutputAddressedToReply {
			respV010orV1.V010Ok.Data, err = AppendReplyInternalDataToData(respV010orV1.V010Ok.Data, respV010orV1.InternaReplyEnclaveSig, respV010orV1.InternalMsgId)
			if err != nil {
				return nil, gasUsed, fmt.Errorf("cannot serialize v010 DataWithInternalReplyInfo into binary : %w", err)
			}
		}
		return respV010orV1.V010Ok, gasUsed, nil
	}

	return nil, gasUsed, fmt.Errorf("handle: cannot detect response type (v0.10 or v1): %w", err)
}

// Query allows a client to execute a contract-specific query. If the result is not empty, it should be
// valid json-encoded data to return to the client.
// The meaning of path and data can be determined by the code. Path is the suffix of the abci.QueryRequest.Path
func (w *Wasmer) Query(
	code CodeID,
	env types.Env,
	queryMsg []byte,
	store KVStore,
	goapi GoAPI,
	querier Querier,
	gasMeter GasMeter,
	gasLimit uint64,
) ([]byte, uint64, error) {
	paramBin, err := json.Marshal(env)
	if err != nil {
		return nil, 0, err
	}
	data, gasUsed, err := api.Query(w.cache, code, paramBin, queryMsg, &gasMeter, store, &goapi, &querier, gasLimit)
	if err != nil {
		return nil, gasUsed, err
	}

	var resp types.QueryResponse
	err = json.Unmarshal(data, &resp)
	if err != nil {
		return nil, gasUsed, err
	}
	if resp.Err != nil {
		return nil, gasUsed, fmt.Errorf("%+v", resp.Err)
	}
	return resp.Ok, gasUsed, nil
}

// AnalyzeCode returns a report of static analysis of the wasm contract (uncompiled).
// This contract must have been stored in the cache previously (via Create).
// Only info currently returned is if it exposes all ibc entry points, but this may grow later
func (w *Wasmer) AnalyzeCode(
	codeHash []byte,
) (*v1types.AnalysisReport, error) {
	return api.AnalyzeCode(w.cache, codeHash)
}
