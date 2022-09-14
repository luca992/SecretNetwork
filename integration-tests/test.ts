import { sha256 } from "@noble/hashes/sha256";
import { execSync } from "child_process";
import * as fs from "fs";
import {
  fromBase64,
  fromUtf8,
  MsgExecuteContract,
  ProposalType,
  SecretNetworkClient,
  toBase64,
  toHex,
  toUtf8,
  Tx,
  TxResultCode,
  Wallet,
} from "secretjs";
import {
  QueryBalanceRequest,
  QueryBalanceResponse,
} from "secretjs//dist/protobuf_stuff/cosmos/bank/v1beta1/query";
import { MsgSend } from "secretjs/dist/protobuf_stuff/cosmos/bank/v1beta1/tx";
import { AminoWallet } from "secretjs/dist/wallet_amino";
import {
  ibcDenom,
  sleep,
  storeContracts,
  waitForBlocks,
  Contract,
  instantiateContracts,
  cleanBytes,
} from "./utils";

type Account = {
  address: string;
  mnemonic: string;
  walletAmino: AminoWallet;
  walletProto: Wallet;
  secretjs: SecretNetworkClient;
};

const accountsCount = 30;

// @ts-ignore
// accounts on secretdev-1
const accounts: Account[] = new Array(accountsCount);
const contracts = {
  "secretdev-1": {
    v010: new Contract("v010"),
  },
};

let v010Wasm: Uint8Array;
let readonly: SecretNetworkClient;

beforeAll(async () => {
  const mnemonics = [
    "grant rice replace explain federal release fix clever romance raise often wild taxi quarter soccer fiber love must tape steak together observe swap guitar",
    "jelly shadow frog dirt dragon use armed praise universe win jungle close inmate rain oil canvas beauty pioneer chef soccer icon dizzy thunder meadow",
  ];

  // Create clients for all of the existing wallets in secretdev-1
  for (let i = 0; i < mnemonics.length; i++) {
    const mnemonic = mnemonics[i];
    const walletAmino = new AminoWallet(mnemonic);
    accounts[i] = {
      address: walletAmino.address,
      mnemonic: mnemonic,
      walletAmino,
      walletProto: new Wallet(mnemonic),
      secretjs: await SecretNetworkClient.create({
        grpcWebUrl: "http://localhost:9091",
        wallet: walletAmino,
        walletAddress: walletAmino.address,
        chainId: "secretdev-1",
      }),
    };
  }

  // Create temporary wallets to fit all other usages (See TXCount test)
  for (let i = mnemonics.length; i < accountsCount; i++) {
    const wallet = new AminoWallet();
    const [{ address }] = await wallet.getAccounts();
    const walletProto = new Wallet(wallet.mnemonic);

    accounts[i] = {
      address: address,
      mnemonic: wallet.mnemonic,
      walletAmino: wallet,
      walletProto: walletProto,
      secretjs: await SecretNetworkClient.create({
        grpcWebUrl: "http://localhost:9091",
        chainId: "secretdev-1",
        wallet: wallet,
        walletAddress: address,
      }),
    };
  }

  // Send 100k SCRT from account 0 to each of accounts 1-iterations
  const { secretjs } = accounts[0];

  console.log("Funding accounts...");
  let t: Tx;
  try {
    t = await secretjs.tx.bank.multiSend(
      {
        inputs: [
          {
            address: secretjs.address,
            coins: [
              {
                denom: "uscrt",
                amount: String(100_000 * 1e6 * (accountsCount - 1)),
              },
            ],
          },
        ],
        outputs: accounts.slice(1).map(({ secretjs}) => ({
              address: secretjs.address,
              coins: [{ denom: "uscrt", amount: String(100_000 * 1e6) }],
            })
          ),
      },
      {
        gasLimit: 200_000,
      }
    );
  } catch (e) {

    throw new Error(`Failed to multisend: ${e.stack}`);
  }

  if (t.code !== 0) {
    console.error(`failed to multisend coins`);
    throw new Error("Failed to multisend coins to initial accounts");
  }

  readonly = await SecretNetworkClient.create({
    chainId: "secretdev-1",
    grpcWebUrl: "http://localhost:9091",
  });

  v010Wasm = fs.readFileSync(
    `${__dirname}/contract-v0.10/contract.wasm`
  ) as Uint8Array;
  contracts["secretdev-1"].v010.codeHash = toHex(sha256(v010Wasm));

  console.log("Storing contracts on secretdev-1...");
  let tx: Tx = await storeContracts(accounts[0].secretjs, [v010Wasm]);
  console.log("finished Storing contracts on secretdev-1...");

  contracts["secretdev-1"].v010.codeId = Number(
    tx.arrayLog.reverse().find((x) => x.key === "code_id").value
  );

  console.log("Instantiating contracts on secretdev-1...");
  tx = await instantiateContracts(accounts[0].secretjs, [
    contracts["secretdev-1"].v010,
  ]);

  contracts["secretdev-1"].v010.address = tx.arrayLog
    .reverse()
    .find((x) => x.key === "contract_address").value;

  // create a second validator for MsgRedelegate tests
  const { validators } = await readonly.query.staking.validators({});
  if (validators.length === 1) {
    tx = await accounts[1].secretjs.tx.staking.createValidator(
      {
        selfDelegatorAddress: accounts[1].address,
        commission: {
          maxChangeRate: 0.01,
          maxRate: 0.1,
          rate: 0.05,
        },
        description: {
          moniker: "banana",
          identity: "papaya",
          website: "watermelon.com",
          securityContact: "info@watermelon.com",
          details: "We are the banana papaya validator",
        },
        pubkey: toBase64(new Uint8Array(32).fill(1)),
        minSelfDelegation: "1",
        initialDelegation: { amount: "1", denom: "uscrt" },
      },
      { gasLimit: 100_000 }
    );
    expect(tx.code).toBe(TxResultCode.Success);
  }
});

describe("BankMsg", () => {
  describe("Send", () => {
    describe("v0.10", () => {
      test("success", async () => {
        const tx = await accounts[0].secretjs.tx.compute.executeContract(
          {
            sender: accounts[0].address,
            contractAddress: contracts["secretdev-1"].v010.address,
            codeHash: contracts["secretdev-1"].v010.codeHash,
            msg: {
              bank_msg_send: {
                to_address: accounts[1].address,
                amount: [{ amount: "1", denom: "uscrt" }],
              },
            },
            sentFunds: [{ amount: "1", denom: "uscrt" }],
          },
          { gasLimit: 250_000 }
        );
        if (tx.code !== TxResultCode.Success) {
          console.error(tx.rawLog);
        }
        expect(tx.code).toBe(TxResultCode.Success);
        expect(
          tx.arrayLog.filter((x) => x.type === "coin_spent")
        ).toStrictEqual([
          {
            key: "spender",
            msg: 0,
            type: "coin_spent",
            value: accounts[0].address,
          },
          { key: "amount", msg: 0, type: "coin_spent", value: "1uscrt" },
          {
            key: "spender",
            msg: 0,
            type: "coin_spent",
            value: contracts["secretdev-1"].v010.address,
          },
          { key: "amount", msg: 0, type: "coin_spent", value: "1uscrt" },
        ]);
        expect(
          tx.arrayLog.filter((x) => x.type === "coin_received")
        ).toStrictEqual([
          {
            key: "receiver",
            msg: 0,
            type: "coin_received",
            value: contracts["secretdev-1"].v010.address,
          },
          { key: "amount", msg: 0, type: "coin_received", value: "1uscrt" },
          {
            key: "receiver",
            msg: 0,
            type: "coin_received",
            value: accounts[1].address,
          },
          { key: "amount", msg: 0, type: "coin_received", value: "1uscrt" },
        ]);
      });

      test("error", async () => {
        const { balance } = await readonly.query.bank.balance({
          address: contracts["secretdev-1"].v010.address,
          denom: "uscrt",
        });
        const contractBalance = Number(balance?.amount) ?? 0;

        const tx = await accounts[0].secretjs.tx.compute.executeContract(
          {
            sender: accounts[0].address,
            contractAddress: contracts["secretdev-1"].v010.address,
            codeHash: contracts["secretdev-1"].v010.codeHash,
            msg: {
              bank_msg_send: {
                to_address: accounts[1].address,
                amount: [
                  { amount: String(contractBalance + 1), denom: "uscrt" },
                ],
              },
            },
          },
          { gasLimit: 250_000 }
        );

        expect(tx.code).toBe(TxResultCode.ErrInsufficientFunds);
        expect(tx.rawLog).toContain(
          `${contractBalance}uscrt is smaller than ${contractBalance + 1}uscrt`
        );
      });
    });
  });
});

describe("CustomMsg", () => {
  test("v0.10", async () => {
    const tx = await accounts[0].secretjs.tx.compute.executeContract(
      {
        sender: accounts[0].address,
        contractAddress: contracts["secretdev-1"].v010.address,
        codeHash: contracts["secretdev-1"].v010.codeHash,
        msg: {
          custom_msg: {},
        },
      },
      { gasLimit: 250_000 }
    );
    if (tx.code !== 10) {
      console.error("actual tx code:", tx.code);
      console.error(tx.rawLog);
    }
    expect(tx.code).toBe(10 /* WASM ErrInvalidMsg */);
    expect(tx.rawLog).toContain("invalid CosmosMsg from the contract");
  });
});

describe("GovMsgVote", () => {
  let proposalId: number;

  beforeAll(async () => {
    let tx = await accounts[0].secretjs.tx.gov.submitProposal(
      {
        type: ProposalType.TextProposal,
        proposer: accounts[0].address,
        // on localsecret min deposit is 10 SCRT
        initialDeposit: [{ amount: String(10_000_000), denom: "uscrt" }],
        content: {
          title: "Hi",
          description: "Hello",
        },
      },
      {
        broadcastCheckIntervalMs: 100,
        gasLimit: 5_000_000,
      }
    );
    if (tx.code !== TxResultCode.Success) {
      console.error(tx.rawLog);
    }
    expect(tx.code).toBe(TxResultCode.Success);

    proposalId = Number(
      tx.jsonLog?.[0].events
        .find((e) => e.type === "submit_proposal")
        ?.attributes.find((a) => a.key === "proposal_id")?.value
    );
    expect(proposalId).toBeGreaterThanOrEqual(1);
  });

  describe("v1", () => {
    test.skip("success", async () => {
      // TODO
    });
    test.skip("error", async () => {
      // TODO
    });
  });

  describe("v0.10", () => {
    test("success", async () => {
      const tx = await accounts[0].secretjs.tx.compute.executeContract(
        {
          sender: accounts[0].address,
          contractAddress: contracts["secretdev-1"].v010.address,
          codeHash: contracts["secretdev-1"].v010.codeHash,
          msg: {
            gov_msg_vote: {
              proposal: proposalId,
              vote_option: "Yes",
            },
          },
        },
        { gasLimit: 250_000 }
      );
      if (tx.code !== TxResultCode.Success) {
        console.error(tx.rawLog);
      }
      expect(tx.code).toBe(TxResultCode.Success);

      const { attributes } = tx.jsonLog[0].events.find(
        (x) => x.type === "proposal_vote"
      );
      expect(attributes).toContainEqual({
        key: "proposal_id",
        value: String(proposalId),
      });
      expect(attributes).toContainEqual({
        key: "option",
        value: '{"option":1,"weight":"1.000000000000000000"}',
      });
    });

    test("error", async () => {
      const tx = await accounts[0].secretjs.tx.compute.executeContract(
        {
          sender: accounts[0].address,
          contractAddress: contracts["secretdev-1"].v010.address,
          codeHash: contracts["secretdev-1"].v010.codeHash,
          msg: {
            gov_msg_vote: {
              proposal: proposalId + 1e6,
              vote_option: "Yes",
            },
          },
        },
        { gasLimit: 250_000 }
      );

      expect(tx.code).toBe(2 /* Gov ErrUnknownProposal */);
      expect(tx.rawLog).toContain(`${proposalId + 1e6}: unknown proposal`);
    });
  });
});

describe("Wasm", () => {
  describe("MsgInstantiateContract", () => {
    describe("v0.10", () => {
      test("success", async () => {
        const tx = await accounts[0].secretjs.tx.compute.executeContract(
          {
            sender: accounts[0].address,
            contractAddress: contracts["secretdev-1"].v010.address,
            codeHash: contracts["secretdev-1"].v010.codeHash,
            msg: {
              wasm_msg_instantiate: {
                code_id: contracts["secretdev-1"].v010.codeId,
                callback_code_hash: contracts["secretdev-1"].v010.codeHash,
                msg: toBase64(toUtf8(JSON.stringify({ echo: {} }))),
                send: [],
                label: `v010-${Date.now()}`,
              },
            },
          },
          { gasLimit: 250_000 }
        );

        if (tx.code !== TxResultCode.Success) {
          console.error(tx.rawLog);
        }
        expect(tx.code).toBe(TxResultCode.Success);

        const { attributes } = tx.jsonLog[0].events.find(
          (e) => e.type === "wasm"
        );
        expect(attributes.length).toBe(2);
        expect(attributes[0].key).toBe("contract_address");
        expect(attributes[0].value).toBe(contracts["secretdev-1"].v010.address);
        expect(attributes[1].key).toBe("contract_address");
        expect(attributes[1].value).not.toBe(
          contracts["secretdev-1"].v010.address
        );
      });

      test("error", async () => {
        const tx = await accounts[0].secretjs.tx.compute.executeContract(
          {
            sender: accounts[0].address,
            contractAddress: contracts["secretdev-1"].v010.address,
            codeHash: contracts["secretdev-1"].v010.codeHash,
            msg: {
              wasm_msg_instantiate: {
                code_id: contracts["secretdev-1"].v010.codeId,
                callback_code_hash: contracts["secretdev-1"].v010.codeHash,
                msg: toBase64(toUtf8(JSON.stringify({ blabla: {} }))),
                send: [],
                label: `v010-${Date.now()}`,
              },
            },
          },
          { gasLimit: 250_000 }
        );

        if (tx.code !== 2) {
          console.error(tx.rawLog);
        }
        expect(tx.code).toBe(2 /* WASM ErrInstantiateFailed */);

        expect(tx.rawLog).toContain("unknown variant `blabla`");
        expect(tx.rawLog).toContain("instantiate contract failed");
      });
    });
  });

  describe("MsgExecuteContract", () => {
    describe("v0.10", () => {
      test("success", async () => {
        const tx = await accounts[0].secretjs.tx.compute.executeContract(
          {
            sender: accounts[0].address,
            contractAddress: contracts["secretdev-1"].v010.address,
            codeHash: contracts["secretdev-1"].v010.codeHash,
            msg: {
              wasm_msg_execute: {
                contract_addr: contracts["secretdev-1"].v010.address,
                callback_code_hash: contracts["secretdev-1"].v010.codeHash,
                msg: toBase64(toUtf8(JSON.stringify({ echo: {} }))),
                send: [],
              },
            },
          },
          { gasLimit: 250_000 }
        );

        if (tx.code !== TxResultCode.Success) {
          console.error(tx.rawLog);
        }
        expect(tx.code).toBe(TxResultCode.Success);

        const { attributes } = tx.jsonLog[0].events.find(
          (e) => e.type === "wasm"
        );
        expect(attributes.length).toBe(2);
        expect(attributes[0].key).toBe("contract_address");
        expect(attributes[0].value).toBe(contracts["secretdev-1"].v010.address);
        expect(attributes[1].key).toBe("contract_address");
        expect(attributes[1].value).toBe(contracts["secretdev-1"].v010.address);
      });

      test("error", async () => {
        const tx = await accounts[0].secretjs.tx.compute.executeContract(
          {
            sender: accounts[0].address,
            contractAddress: contracts["secretdev-1"].v010.address,
            codeHash: contracts["secretdev-1"].v010.codeHash,
            msg: {
              wasm_msg_execute: {
                contract_addr: contracts["secretdev-1"].v010.address,
                callback_code_hash: contracts["secretdev-1"].v010.codeHash,
                msg: toBase64(toUtf8(JSON.stringify({ blabla: {} }))),
                send: [],
              },
            },
          },
          { gasLimit: 250_000 }
        );

        if (tx.code !== 3) {
          console.error(tx.rawLog);
        }
        expect(tx.code).toBe(3 /* WASM ErrExecuteFailed */);

        expect(tx.rawLog).toContain("unknown variant `blabla`");
        expect(tx.rawLog).toContain("execute contract failed");
      });
    });
  });
});

describe("StakingMsg", () => {
  describe("Delegate", () => {
    describe("v0.10", () => {
      test("success", async () => {
        const { validators } = await readonly.query.staking.validators({});
        const validator = validators[0].operatorAddress;

        const tx = await accounts[0].secretjs.tx.compute.executeContract(
          {
            sender: accounts[0].address,
            contractAddress: contracts["secretdev-1"].v010.address,
            codeHash: contracts["secretdev-1"].v010.codeHash,
            msg: {
              staking_msg_delegate: {
                validator,
                amount: { amount: "1", denom: "uscrt" },
              },
            },
            sentFunds: [{ amount: "1", denom: "uscrt" }],
          },
          { gasLimit: 250_000 }
        );
        if (tx.code !== TxResultCode.Success) {
          console.error(tx.rawLog);
        }
        expect(tx.code).toBe(TxResultCode.Success);

        const { attributes } = tx.jsonLog[0].events.find(
          (e) => e.type === "delegate"
        );
        expect(attributes).toContainEqual({ key: "amount", value: "1uscrt" });
        expect(attributes).toContainEqual({
          key: "validator",
          value: validator,
        });
      });

      test("error", async () => {
        const { validators } = await readonly.query.staking.validators({});
        const validator = validators[0].operatorAddress;

        const tx = await accounts[0].secretjs.tx.compute.executeContract(
          {
            sender: accounts[0].address,
            contractAddress: contracts["secretdev-1"].v010.address,
            codeHash: contracts["secretdev-1"].v010.codeHash,
            msg: {
              staking_msg_delegate: {
                validator: validator + "garbage",
                amount: { amount: "1", denom: "uscrt" },
              },
            },
            sentFunds: [{ amount: "1", denom: "uscrt" }],
          },
          { gasLimit: 250_000 }
        );

        expect(tx.code).toBe(TxResultCode.ErrInvalidAddress);
        expect(tx.rawLog).toContain(
          `${validator + "garbage"}: invalid address`
        );
      });
    });
  });

  describe("Undelegate", () => {
    describe("v0.10", () => {
      test("success", async () => {
        const { validators } = await readonly.query.staking.validators({});
        const validator = validators[0].operatorAddress;

        const tx = await accounts[0].secretjs.tx.broadcast(
          [
            new MsgExecuteContract({
              sender: accounts[0].address,
              contractAddress: contracts["secretdev-1"].v010.address,
              codeHash: contracts["secretdev-1"].v010.codeHash,
              msg: {
                staking_msg_delegate: {
                  validator,
                  amount: { amount: "1", denom: "uscrt" },
                },
              },
              sentFunds: [{ amount: "1", denom: "uscrt" }],
            }),
            new MsgExecuteContract({
              sender: accounts[0].address,
              contractAddress: contracts["secretdev-1"].v010.address,
              codeHash: contracts["secretdev-1"].v010.codeHash,
              msg: {
                staking_msg_undelegate: {
                  validator,
                  amount: { amount: "1", denom: "uscrt" },
                },
              },
              sentFunds: [{ amount: "1", denom: "uscrt" }],
            }),
          ],
          { gasLimit: 250_000 }
        );
        if (tx.code !== TxResultCode.Success) {
          console.error(tx.rawLog);
        }
        expect(tx.code).toBe(TxResultCode.Success);

        const { attributes } = tx.jsonLog[1].events.find(
          (e) => e.type === "unbond"
        );
        expect(attributes).toContainEqual({ key: "amount", value: "1uscrt" });
        expect(attributes).toContainEqual({
          key: "validator",
          value: validator,
        });
      });

      test("error", async () => {
        const { validators } = await readonly.query.staking.validators({});
        const validator = validators[0].operatorAddress;

        const tx = await accounts[0].secretjs.tx.compute.executeContract(
          {
            sender: accounts[0].address,
            contractAddress: contracts["secretdev-1"].v010.address,
            codeHash: contracts["secretdev-1"].v010.codeHash,
            msg: {
              staking_msg_undelegate: {
                validator: validator + "garbage",
                amount: { amount: "1", denom: "uscrt" },
              },
            },
            sentFunds: [{ amount: "1", denom: "uscrt" }],
          },
          { gasLimit: 250_000 }
        );

        expect(tx.code).toBe(TxResultCode.ErrInvalidAddress);
        expect(tx.rawLog).toContain(
          `${validator + "garbage"}: invalid address`
        );
      });
    });
  });

  describe("Redelegate", () => {
    describe("v0.10", () => {
      test("success", async () => {
        const { validators } = await readonly.query.staking.validators({});
        const validatorA = validators[0].operatorAddress;
        const validatorB = validators[1].operatorAddress;

        const tx = await accounts[0].secretjs.tx.broadcast(
          [
            new MsgExecuteContract({
              sender: accounts[0].address,
              contractAddress: contracts["secretdev-1"].v010.address,
              codeHash: contracts["secretdev-1"].v010.codeHash,
              msg: {
                staking_msg_delegate: {
                  validator: validatorA,
                  amount: { amount: "1", denom: "uscrt" },
                },
              },
              sentFunds: [{ amount: "1", denom: "uscrt" }],
            }),
            new MsgExecuteContract({
              sender: accounts[0].address,
              contractAddress: contracts["secretdev-1"].v010.address,
              codeHash: contracts["secretdev-1"].v010.codeHash,
              msg: {
                staking_msg_redelegate: {
                  src_validator: validatorA,
                  dst_validator: validatorB,
                  amount: { amount: "1", denom: "uscrt" },
                },
              },
              sentFunds: [{ amount: "1", denom: "uscrt" }],
            }),
          ],
          { gasLimit: 350_000 }
        );
        if (tx.code !== TxResultCode.Success) {
          console.error(tx.rawLog);
        }
        expect(tx.code).toBe(TxResultCode.Success);

        const { attributes } = tx.jsonLog[1].events.find(
          (e) => e.type === "redelegate"
        );
        expect(attributes).toContainEqual({ key: "amount", value: "1uscrt" });
        expect(attributes).toContainEqual({
          key: "source_validator",
          value: validatorA,
        });
        expect(attributes).toContainEqual({
          key: "destination_validator",
          value: validatorB,
        });
      });

      test("error", async () => {
        const { validators } = await readonly.query.staking.validators({});
        const validator = validators[0].operatorAddress;

        const tx = await accounts[0].secretjs.tx.compute.executeContract(
          {
            sender: accounts[0].address,
            contractAddress: contracts["secretdev-1"].v010.address,
            codeHash: contracts["secretdev-1"].v010.codeHash,
            msg: {
              staking_msg_redelegate: {
                src_validator: validator,
                dst_validator: validator + "garbage",
                amount: { amount: "1", denom: "uscrt" },
              },
            },
            sentFunds: [{ amount: "1", denom: "uscrt" }],
          },
          { gasLimit: 250_000 }
        );

        expect(tx.code).toBe(TxResultCode.ErrInvalidAddress);
        expect(tx.rawLog).toContain(
          `${validator + "garbage"}: invalid address`
        );
      });
    });
  });

  describe("Withdraw", () => {
    describe("v0.10", () => {
      test("success", async () => {
        const { validators } = await readonly.query.staking.validators({});
        const validator = validators[0].operatorAddress;

        const tx = await accounts[0].secretjs.tx.broadcast(
          [
            new MsgExecuteContract({
              sender: accounts[0].address,
              contractAddress: contracts["secretdev-1"].v010.address,
              codeHash: contracts["secretdev-1"].v010.codeHash,
              msg: {
                staking_msg_delegate: {
                  validator: validator,
                  amount: { amount: "1", denom: "uscrt" },
                },
              },
              sentFunds: [{ amount: "1", denom: "uscrt" }],
            }),
            new MsgExecuteContract({
              sender: accounts[0].address,
              contractAddress: contracts["secretdev-1"].v010.address,
              codeHash: contracts["secretdev-1"].v010.codeHash,
              msg: {
                staking_msg_withdraw: {
                  validator: validator,
                  recipient: accounts[0].address,
                },
              },
              sentFunds: [{ amount: "1", denom: "uscrt" }],
            }),
          ],
          { gasLimit: 250_000 }
        );
        if (tx.code !== TxResultCode.Success) {
          console.error(tx.rawLog);
        }
        expect(tx.code).toBe(TxResultCode.Success);

        const { attributes } = tx.jsonLog[1].events.find(
          (e) => e.type === "withdraw_rewards"
        );
        expect(attributes).toContainEqual({
          key: "validator",
          value: validator,
        });
      });

      test("error", async () => {
        const { validators } = await readonly.query.staking.validators({});
        const validator = validators[0].operatorAddress;

        const tx = await accounts[0].secretjs.tx.compute.executeContract(
          {
            sender: accounts[0].address,
            contractAddress: contracts["secretdev-1"].v010.address,
            codeHash: contracts["secretdev-1"].v010.codeHash,
            msg: {
              staking_msg_redelegate: {
                src_validator: validator,
                dst_validator: validator + "garbage",
                amount: { amount: "1", denom: "uscrt" },
              },
            },
            sentFunds: [{ amount: "1", denom: "uscrt" }],
          },
          { gasLimit: 250_000 }
        );

        expect(tx.code).toBe(TxResultCode.ErrInvalidAddress);
        expect(tx.rawLog).toContain(
          `${validator + "garbage"}: invalid address`
        );
      });
    });
  });
});

describe("BankQuery", () => {
  describe("Balance", () => {
    test("v0.10", async () => {
      const result: any = await readonly.query.compute.queryContract({
        contractAddress: contracts["secretdev-1"].v010.address,
        codeHash: contracts["secretdev-1"].v010.codeHash,
        query: {
          bank_balance: {
            address: accounts[0].address,
            denom: "uscrt",
          },
        },
      });
      expect(result?.amount?.denom).toBe("uscrt");
      expect(Number(result?.amount?.amount)).toBeGreaterThanOrEqual(1);
    });
  });
});

describe("Staking Query", () => {
  describe("Bonded Denom", () => {
    test("v0.10", async () => {
      const result: any = await readonly.query.compute.queryContract({
        contractAddress: contracts["secretdev-1"].v010.address,
        codeHash: contracts["secretdev-1"].v010.codeHash,
        query: {
          staking_bonded_denom: {},
        },
      });

      expect(result?.denom).toBe("uscrt");
    });
  });

  describe("All Delegations", () => {
    describe("v0.10", () => {
      test("success - validator has delegations", async () => {
        const result: any = await readonly.query.compute.queryContract({
          contractAddress: contracts["secretdev-1"].v010.address,
          codeHash: contracts["secretdev-1"].v010.codeHash,
          query: {
            staking_all_delegations: { delegator: accounts[0].address },
          },
        });

        expect(result?.delegations.length).toBe(1);
        expect(result?.delegations[0]).toStrictEqual(
          {
            delegator: accounts[0].address,
            validator: "secretvaloper1ap26qrlp8mcq2pg6r47w43l0y8zkqm8aynpdzc",
            amount: { denom: "uscrt", amount: "1000000" },
          }
        );
      });

      test("success - validator does not have delegations", async () => {
        const result: any = await readonly.query.compute.queryContract({
          contractAddress: contracts["secretdev-1"].v010.address,
          codeHash: contracts["secretdev-1"].v010.codeHash,
          query: {
            staking_all_delegations: { delegator: accounts[accounts.length - 1].address },
          },
        });

        expect(result?.delegations.length).toBe(0);
      });

      test("fail - bad address", async () => {
        console.log("readonly addr", readonly.address);
        const result: any = await readonly.query.compute.queryContract({
          contractAddress: contracts["secretdev-1"].v010.address,
          codeHash: contracts["secretdev-1"].v010.codeHash,
          query: {
            staking_all_delegations: { delegator: 'secret1nosuchaddress' },
          },
        });

        expect(JSON.parse(result)?.generic_err?.msg).toBe("secret1nosuchaddress: invalid address");
      });
    });
  });

  // skipping since the contract has an error when parsing the delegation response type
  describe("Delegation", () => {
    describe("v0.10", () => {
      test("success - validator has delegations", async () => {
        const result: any = await readonly.query.compute.queryContract({
          contractAddress: contracts["secretdev-1"].v010.address,
          codeHash: contracts["secretdev-1"].v010.codeHash,
          query: {
            staking_delegation: {
              delegator: accounts[0].address,
              validator: "secretvaloper1ap26qrlp8mcq2pg6r47w43l0y8zkqm8aynpdzc",
            },
          },
        });

        expect(result?.delegation.delegator).toBe("secret1ap26qrlp8mcq2pg6r47w43l0y8zkqm8a450s03");
        expect(result?.delegation.validator).toBe("secretvaloper1ap26qrlp8mcq2pg6r47w43l0y8zkqm8aynpdzc");
        expect(result?.delegation.amount).toStrictEqual({ denom: "uscrt", amount: "1000000" });
        expect(result?.delegation.can_redelegate).toStrictEqual({ denom: "uscrt", amount: "1000000" });
        result?.delegation.accumulated_rewards.forEach(reward =>
          expect(Object.keys(reward)).toEqual(expect.arrayContaining(["denom", "amount"]))
        );
      });

      test("success - validator does not have delegations", async () => {
        const result: any = await readonly.query.compute.queryContract({
          contractAddress: contracts["secretdev-1"].v010.address,
          codeHash: contracts["secretdev-1"].v010.codeHash,
          query: {
            staking_delegation: {
              delegator: accounts[accounts.length - 1].address,
              validator: "secretvaloper1ap26qrlp8mcq2pg6r47w43l0y8zkqm8aynpdzc"
            },
          },
        });

        expect(result?.delegation).toBeNull();
      });

      test("fail - bad addresses", async () => {
        const result: any = await readonly.query.compute.queryContract({
          contractAddress: contracts["secretdev-1"].v010.address,
          codeHash: contracts["secretdev-1"].v010.codeHash,
          query: {
            staking_delegation: { validator: 'secret1nosuchaddress', delegator: 'secret1nosuchaddress' },
          },
        });

        expect(JSON.parse(result)?.generic_err?.msg).toBe("secret1nosuchaddress: invalid address");
      });
    });
  });

  describe("Validators", () => {
    test("v0.10", async () => {
      const result: any = await readonly.query.compute.queryContract({
        contractAddress: contracts["secretdev-1"].v010.address,
        codeHash: contracts["secretdev-1"].v010.codeHash,
        query: {
          staking_validators: {},
        },
      });

      expect(result?.validators.length).toBe(1);
      expect(result?.validators[0]).toStrictEqual({
        address: "secretvaloper1ap26qrlp8mcq2pg6r47w43l0y8zkqm8aynpdzc",
        commission: "0.1",
        max_commission: "0.2",
        max_change_rate: "0.01"
      });
    });
  });

  describe("Unbonding Delegations", () => {
    describe("v0.10", () => {
      test("success", async () => {
        const result: any = await readonly.query.compute.queryContract({
          contractAddress: contracts["secretdev-1"].v010.address,
          codeHash: contracts["secretdev-1"].v010.codeHash,
          query: {
            staking_unbonding_delegations: { delegator: accounts[0].address },
          },
        });

        expect(result?.delegations.length).toBe(0);
      });
    });

    // disabled for now because there's a bug that causes a different failure from the expected
    test.skip("fail - bad address", async () => {
      const result: any = await readonly.query.compute.queryContract({
        contractAddress: contracts["secretdev-1"].v010.address,
        codeHash: contracts["secretdev-1"].v010.codeHash,
        query: {
          staking_unbonding_delegations: { delegator: 'secret1nosuchaddress' },
        },
      });

      expect(JSON.parse(result)?.generic_err?.msg).toBe("secret1nosuchaddress: invalid address");
    });
  });
});

describe("Wasm Query", () => {
  describe("Smart", () => {
    let targetContractAddress: string;
    beforeAll(async () => {
      console.log("Instantiating another v010 contract on secretdev-1...");
      const tx = await instantiateContracts(accounts[0].secretjs, [
        contracts["secretdev-1"].v010,
      ]);

      targetContractAddress = tx.arrayLog
        .reverse()
        .find((x) => x.key === "contract_address").value;
    });

    describe("v0.10", () => {
      test("success - query v1 contract", async () => {
        const result: any = await readonly.query.compute.queryContract({
          contractAddress: contracts["secretdev-1"].v010.address,
          codeHash: contracts["secretdev-1"].v010.codeHash,
          query: {
            wasm_smart: {
              contract_addr: targetContractAddress,
              callback_code_hash: contracts["secretdev-1"].v010.codeHash,
              msg: toBase64(Buffer.from('{ "last_ibc_ack": {} }')),
            },
          },
        });

        expect(result).toBe("no ack yet");
      });

      test("fail - unexistent v1 message", async () => {
        const result: any = await readonly.query.compute.queryContract({
          contractAddress: contracts["secretdev-1"].v010.address,
          codeHash: contracts["secretdev-1"].v010.codeHash,
          query: {
            wasm_smart: {
              contract_addr: targetContractAddress,
              callback_code_hash: contracts["secretdev-1"].v010.codeHash,
              msg: toBase64(Buffer.from('{ "no_such_message": {} }')),
            },
          },
        });

        const parsedRes = JSON.parse(result);
        console.log("result", result);
        const receivedErrorMessage = parsedRes?.generic_err?.msg || parsedRes?.parse_err.msg;
        expect(receivedErrorMessage).toContain('unknown variant `no_such_message`');
      });
    });
  });

  describe("Raw", () => {
    describe("v0.10", () => {
      test("should always return empty result", async () => {
        console.log("Instantiating another v010 contract on secretdev-1...");
        const tx = await instantiateContracts(accounts[0].secretjs, [
          contracts["secretdev-1"].v010,
        ]);

        const targetContractAddress = tx.arrayLog
          .reverse()
          .find((x) => x.key === "contract_address").value;
        const result: any = await readonly.query.compute.queryContract({
          contractAddress: contracts["secretdev-1"].v010.address,
          codeHash: contracts["secretdev-1"].v010.codeHash,
          query: {
            wasm_raw: {
              contract_addr: targetContractAddress,
              callback_code_hash: contracts["secretdev-1"].v010.codeHash,
              key: toBase64(Buffer.from('last_ack')),
            },
          },
        });

        expect(result).toStrictEqual([]);
      });
    });
  });
});

describe("Distribution Query", () => {
  describe("Rewards", () => {
    describe("v0.10", () => {
      test("success", async () => {
        const result: any = await readonly.query.compute.queryContract({
          contractAddress: contracts["secretdev-1"].v010.address,
          codeHash: contracts["secretdev-1"].v010.codeHash,
          query: {
            dist_rewards: { delegator: accounts[0].address },
          },
        });

        expect(result?.rewards.length).toBe(1);
        expect(result?.rewards[0].validator_address).toBe("secretvaloper1ap26qrlp8mcq2pg6r47w43l0y8zkqm8aynpdzc");
        expect(Object.keys(result?.rewards[0].reward[0])).toEqual(expect.arrayContaining(["denom", "amount"]));
        expect(result?.total.length).toBe(1);
        expect(result?.total[0].denom).toBe('uscrt');
      });

      test("fail - bad address", async () => {
        const result: any = await readonly.query.compute.queryContract({
          contractAddress: contracts["secretdev-1"].v010.address,
          codeHash: contracts["secretdev-1"].v010.codeHash,
          query: {
            dist_rewards: { delegator: 'secret1nosuchaddress' },
          },
        });

        expect(JSON.parse(result)?.generic_err?.msg).toBe("secret1nosuchaddress: invalid address");
      });
    });
  });
});

describe("Mint Query", () => {
  describe("Inflation", () => {
    test("v0.10", async () => {
      const result: any = await readonly.query.compute.queryContract({
        contractAddress: contracts["secretdev-1"].v010.address,
        codeHash: contracts["secretdev-1"].v010.codeHash,
        query: {
          mint_inflation: {},
        },
      });

      expect(Number(result?.inflation_rate)).toEqual(expect.closeTo(0.13007, 2));
    });
  });

  describe("Bonded Ratio", () => {
    test("v0.10", async () => {
      const result: any = await readonly.query.compute.queryContract({
        contractAddress: contracts["secretdev-1"].v010.address,
        codeHash: contracts["secretdev-1"].v010.codeHash,
        query: {
          mint_bonded_ratio: {},
        },
      });

      expect(Number(result?.bonded_ratio)).toEqual(expect.closeTo(0.0000000000002, 13));
    });
  });
});

describe("Gov Query", () => {
  describe("Proposals", () => {
    test("v0.10", async () => {
      const result: any = await readonly.query.compute.queryContract({
        contractAddress: contracts["secretdev-1"].v010.address,
        codeHash: contracts["secretdev-1"].v010.codeHash,
        query: {
          gov_proposals: {},
        },
      });

      result?.proposals.forEach(proposal => {
        expect(Object.keys(proposal)).toEqual(expect.arrayContaining(["id", "voting_start_time", "voting_end_time"]));
      })
    });
  });
});