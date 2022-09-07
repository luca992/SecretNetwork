import { sha256 } from "@noble/hashes/sha256";
import * as fs from "fs";
import {
  fromBase64,
  MsgExecuteContract,
  MsgInstantiateContract,
  MsgStoreCode,
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
  waitForBlocks,
  waitForIBCChannel,
  waitForIBCConnection,
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
let readonly: SecretNetworkClient;

// @ts-ignore
// accounts on secretdev-2
const accounts2: Account[] = new Array(3);
let readonly2: SecretNetworkClient;

let v1CodeID: number;
let v1Address: string;
let v1CodeHash: string;

let v010CodeID: number;
let v010Address: string;
let v010CodeHash: string;

beforeAll(async () => {
  const mnemonics = [
    "grant rice replace explain federal release fix clever romance raise often wild taxi quarter soccer fiber love must tape steak together observe swap guitar",
    "jelly shadow frog dirt dragon use armed praise universe win jungle close inmate rain oil canvas beauty pioneer chef soccer icon dizzy thunder meadow",
    "chair love bleak wonder skirt permit say assist aunt credit roast size obtain minute throw sand usual age smart exact enough room shadow charge",
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

  // Create clients for all of the existing wallets in secretdev-2
  for (let i = 0; i < mnemonics.length; i++) {
    const mnemonic = mnemonics[i];
    const walletAmino = new AminoWallet(mnemonic);
    accounts2[i] = {
      address: walletAmino.address,
      mnemonic: mnemonic,
      walletAmino,
      walletProto: new Wallet(mnemonic),
      secretjs: await SecretNetworkClient.create({
        grpcWebUrl: "http://localhost:9391",
        wallet: walletAmino,
        walletAddress: walletAmino.address,
        chainId: "secretdev-2",
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

  // Send 100k SCRT from account 0 to each of accounts 1-itrations

  const { secretjs } = accounts[0];

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
        outputs: accounts.slice(1).map(({ address }) => ({
          address,
          coins: [{ denom: "uscrt", amount: String(100_000 * 1e6) }],
        })),
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

  readonly2 = await SecretNetworkClient.create({
    chainId: "secretdev-2",
    grpcWebUrl: "http://localhost:9391",
  });

  await waitForBlocks("secretdev-1");

  const v1Wasm = fs.readFileSync(
    `${__dirname}/contract-v1/contract.wasm`
  ) as Uint8Array;
  v1CodeHash = toHex(sha256(v1Wasm));

  const v010Wasm = fs.readFileSync(
    `${__dirname}/contract-v0.10/contract.wasm`
  ) as Uint8Array;
  v010CodeHash = toHex(sha256(v010Wasm));

  console.log("Uploading contracts...");
  let tx: Tx;
  tx = await accounts[0].secretjs.tx.broadcast(
    [
      new MsgStoreCode({
        sender: accounts[0].address,
        wasmByteCode: v1Wasm,
        source: "",
        builder: "",
      }),
      new MsgStoreCode({
        sender: accounts[0].address,
        wasmByteCode: v010Wasm,
        source: "",
        builder: "",
      }),
    ],
    { gasLimit: 5_000_000 }
  );
  if (tx.code !== TxResultCode.Success) {
    console.error(tx.rawLog);
  }
  expect(tx.code).toBe(TxResultCode.Success);

  v1CodeID = Number(tx.arrayLog.find((x) => x.key === "code_id").value);
  v010CodeID = Number(
    tx.arrayLog.reverse().find((x) => x.key === "code_id").value
  );

  tx = await accounts[0].secretjs.tx.broadcast(
    [
      new MsgInstantiateContract({
        sender: accounts[0].address,
        codeId: v1CodeID,
        codeHash: v1CodeHash,
        initMsg: { nop: {} },
        label: `v1-${Date.now()}`,
      }),
      new MsgInstantiateContract({
        sender: accounts[0].address,
        codeId: v010CodeID,
        codeHash: v010CodeHash,
        initMsg: { echo: {} },
        label: `v010-${Date.now()}`,
      }),
    ],
    { gasLimit: 200_000 }
  );
  if (tx.code !== TxResultCode.Success) {
    console.error(tx.rawLog);
  }
  expect(tx.code).toBe(TxResultCode.Success);

  v1Address = tx.arrayLog.find((x) => x.key === "contract_address").value;
  v010Address = tx.arrayLog
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
    test("v1", async () => {
      const tx = await accounts[0].secretjs.tx.compute.executeContract(
        {
          sender: accounts[0].address,
          contractAddress: v1Address,
          codeHash: v1CodeHash,
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
      expect(tx.arrayLog.filter((x) => x.type === "coin_spent")).toStrictEqual([
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
          value: v1Address,
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
          value: v1Address,
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

    describe("v0.10", () => {
      test("success", async () => {
        const tx = await accounts[0].secretjs.tx.compute.executeContract(
          {
            sender: accounts[0].address,
            contractAddress: v010Address,
            codeHash: v010CodeHash,
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
            value: v010Address,
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
            value: v010Address,
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
          address: v010Address,
          denom: "uscrt",
        });
        const contractBalance = Number(balance?.amount) ?? 0;

        const tx = await accounts[0].secretjs.tx.compute.executeContract(
          {
            sender: accounts[0].address,
            contractAddress: v010Address,
            codeHash: v010CodeHash,
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

describe("Env", () => {
  describe("TransactionInfo", () => {
    describe("TxCount", () => {
      test("execute", async () => {
        jest.setTimeout(10 * 60 * 1_000);
        let txProm: Promise<Tx>[] = new Array(2);
        let success: boolean;
        let shouldBreak: boolean = false;
        for (let j = 0; j < 20 && !shouldBreak; j += 2) {
          for (let i = 0; i < 2; i++) {
            let walletID = j + i + 3;
            success = true;

            txProm[i] = accounts[walletID].secretjs.tx.compute.executeContract(
              {
                sender: accounts[walletID].address,
                contractAddress: v1Address,
                codeHash: v1CodeHash,
                msg: {
                  get_tx_id: {},
                },
                sentFunds: [],
              },
              { gasLimit: 250_000 }
            );
          }

          let txs = await Promise.all(txProm);

          for (let i = 0; i < 2; i++) {
            if (txs[i].code !== TxResultCode.Success) {
              console.error(txs[i].rawLog);
            }

            expect(txs[i].code).toBe(TxResultCode.Success);

            const { attributes } = txs[i].jsonLog[0].events.find(
              (x) => x.type === "wasm-count"
            );

            expect(attributes.length).toBe(2);

            const { value } = attributes.find((x) => x.key === "count-val");

            if (value !== i.toString()) {
              success = false;
              break;
            }
          }

          if (success) {
            break;
          }
        }

        expect(success).toBe(true);
      });
    });
  });
});

describe("CustomMsg", () => {
  test.skip("v1", async () => {
    // TODO
  });

  test("v0.10", async () => {
    const tx = await accounts[0].secretjs.tx.compute.executeContract(
      {
        sender: accounts[0].address,
        contractAddress: v010Address,
        codeHash: v010CodeHash,
        msg: {
          custom_msg: {},
        },
      },
      { gasLimit: 250_000 }
    );
    if (tx.code !== 10) {
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
          contractAddress: v010Address,
          codeHash: v010CodeHash,
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
          contractAddress: v010Address,
          codeHash: v010CodeHash,
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
            contractAddress: v010Address,
            codeHash: v010CodeHash,
            msg: {
              wasm_msg_instantiate: {
                code_id: v010CodeID,
                callback_code_hash: v010CodeHash,
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
        expect(attributes[0].value).toBe(v010Address);
        expect(attributes[1].key).toBe("contract_address");
        expect(attributes[1].value).not.toBe(v010Address);
      });

      test("error", async () => {
        const tx = await accounts[0].secretjs.tx.compute.executeContract(
          {
            sender: accounts[0].address,
            contractAddress: v010Address,
            codeHash: v010CodeHash,
            msg: {
              wasm_msg_instantiate: {
                code_id: v010CodeID,
                callback_code_hash: v010CodeHash,
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

        expect(tx.rawLog).toContain("encrypted:");
        expect(tx.rawLog).toContain("instantiate contract failed");
      });
    });
  });

  describe("MsgExecuteContract", () => {
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
            contractAddress: v010Address,
            codeHash: v010CodeHash,
            msg: {
              wasm_msg_execute: {
                contract_addr: v010Address,
                callback_code_hash: v010CodeHash,
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
        expect(attributes[0].value).toBe(v010Address);
        expect(attributes[1].key).toBe("contract_address");
        expect(attributes[1].value).toBe(v010Address);
      });

      test("error", async () => {
        const tx = await accounts[0].secretjs.tx.compute.executeContract(
          {
            sender: accounts[0].address,
            contractAddress: v010Address,
            codeHash: v010CodeHash,
            msg: {
              wasm_msg_execute: {
                contract_addr: v010Address,
                callback_code_hash: v010CodeHash,
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

        expect(tx.rawLog).toContain("encrypted:");
        expect(tx.rawLog).toContain("execute contract failed");
      });
    });
  });
});

describe("StakingMsg", () => {
  describe("Delegate", () => {
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
        const { validators } = await readonly.query.staking.validators({});
        const validator = validators[0].operatorAddress;

        const tx = await accounts[0].secretjs.tx.compute.executeContract(
          {
            sender: accounts[0].address,
            contractAddress: v010Address,
            codeHash: v010CodeHash,
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
            contractAddress: v010Address,
            codeHash: v010CodeHash,
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
        const { validators } = await readonly.query.staking.validators({});
        const validator = validators[0].operatorAddress;

        const tx = await accounts[0].secretjs.tx.broadcast(
          [
            new MsgExecuteContract({
              sender: accounts[0].address,
              contractAddress: v010Address,
              codeHash: v010CodeHash,
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
              contractAddress: v010Address,
              codeHash: v010CodeHash,
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
            contractAddress: v010Address,
            codeHash: v010CodeHash,
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
        const { validators } = await readonly.query.staking.validators({});
        const validatorA = validators[0].operatorAddress;
        const validatorB = validators[1].operatorAddress;

        const tx = await accounts[0].secretjs.tx.broadcast(
          [
            new MsgExecuteContract({
              sender: accounts[0].address,
              contractAddress: v010Address,
              codeHash: v010CodeHash,
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
              contractAddress: v010Address,
              codeHash: v010CodeHash,
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
          { gasLimit: 250_000 }
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
            contractAddress: v010Address,
            codeHash: v010CodeHash,
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
        const { validators } = await readonly.query.staking.validators({});
        const validator = validators[0].operatorAddress;

        const tx = await accounts[0].secretjs.tx.broadcast(
          [
            new MsgExecuteContract({
              sender: accounts[0].address,
              contractAddress: v010Address,
              codeHash: v010CodeHash,
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
              contractAddress: v010Address,
              codeHash: v010CodeHash,
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
            contractAddress: v010Address,
            codeHash: v010CodeHash,
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

describe("StargateMsg", () => {
  test("v1", async () => {
    const tx = await accounts[0].secretjs.tx.compute.executeContract(
      {
        sender: accounts[0].address,
        contractAddress: v1Address,
        codeHash: v1CodeHash,
        msg: {
          stargate_msg: {
            type_url: "/cosmos.bank.v1beta1.MsgSend",
            value: toBase64(
              MsgSend.encode({
                fromAddress: v1Address,
                toAddress: accounts[1].address,
                amount: [{ amount: "1", denom: "uscrt" }],
              }).finish()
            ),
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
    expect(tx.arrayLog.filter((x) => x.type === "coin_spent")).toStrictEqual([
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
        value: v1Address,
      },
      { key: "amount", msg: 0, type: "coin_spent", value: "1uscrt" },
    ]);
    expect(tx.arrayLog.filter((x) => x.type === "coin_received")).toStrictEqual(
      [
        {
          key: "receiver",
          msg: 0,
          type: "coin_received",
          value: v1Address,
        },
        { key: "amount", msg: 0, type: "coin_received", value: "1uscrt" },
        {
          key: "receiver",
          msg: 0,
          type: "coin_received",
          value: accounts[1].address,
        },
        { key: "amount", msg: 0, type: "coin_received", value: "1uscrt" },
      ]
    );
  });
});

describe("StargateQuery", () => {
  test("v1", async () => {
    const result: any = await readonly.query.compute.queryContract({
      contractAddress: v1Address,
      codeHash: v1CodeHash,
      query: {
        stargate: {
          path: "/cosmos.bank.v1beta1.Query/Balance",
          data: toBase64(
            QueryBalanceRequest.encode({
              address: accounts[0].address,
              denom: "uscrt",
            }).finish()
          ),
        },
      },
    });

    const response = QueryBalanceResponse.decode(fromBase64(result));
    expect(response?.balance?.denom).toBe("uscrt");
    expect(Number(response?.balance?.amount)).toBeGreaterThanOrEqual(1);
  });
});

describe("BankQuery", () => {
  describe("Balance", () => {
    test("v1", async () => {
      const result: any = await readonly.query.compute.queryContract({
        contractAddress: v1Address,
        codeHash: v1CodeHash,
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

    test("v0.10", async () => {
      const result: any = await readonly.query.compute.queryContract({
        contractAddress: v010Address,
        codeHash: v010CodeHash,
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

describe("IBC", () => {
  beforeAll(async () => {
    console.log("Waiting for IBC to set up...");
    await waitForIBCConnection("secretdev-1", "http://localhost:9091");
    await waitForIBCConnection("secretdev-2", "http://localhost:9391");

    await waitForIBCChannel(
      "secretdev-1",
      "http://localhost:9091",
      "channel-0"
    );
    await waitForIBCChannel(
      "secretdev-2",
      "http://localhost:9391",
      "channel-0"
    );
  }, 180_000 /* 3 minutes */);

  test("transfer sanity", async () => {
    const denom = ibcDenom(
      [
        {
          portId: "transfer",
          channelId: "channel-0",
        },
      ],
      "uscrt"
    );
    const { balance: balanceBefore } = await readonly2.query.bank.balance({
      address: accounts2[0].address,
      denom,
    });
    const amountBefore = Number(balanceBefore?.amount ?? "0");

    const result = await accounts[0].secretjs.tx.ibc.transfer({
      receiver: accounts[0].address,
      sender: accounts[0].address,
      sourceChannel: "channel-0",
      sourcePort: "transfer",
      token: {
        denom: "uscrt",
        amount: "1",
      },
      timeoutTimestampSec: String(Math.floor(Date.now() / 1000 + 30)),
    });

    if (result.code !== 0) {
      console.error(result.rawLog);
    }

    expect(result.code).toBe(TxResultCode.Success);

    // checking ack/timeout on secretdev-1 might be cleaner
    while (true) {
      try {
        const { balance: balanceAfter } = await readonly2.query.bank.balance({
          address: accounts2[0].address,
          denom,
        });
        const amountAfter = Number(balanceAfter?.amount ?? "0");

        if (amountAfter === amountBefore + 1) {
          break;
        }
      } catch (e) {
        // console.error("ibc denom balance error:", e);
      }
      await sleep(200);
    }
    expect(true).toBe(true);
  }, 30_000 /* 30 seconds */);
});