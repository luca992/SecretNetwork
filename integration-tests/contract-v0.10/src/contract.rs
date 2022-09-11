use cosmwasm_std::{to_binary, Api, BalanceResponse, BankMsg, BankQuery, Binary, Coin, CosmosMsg, Empty, Env, Extern, GovMsg, HandleResponse, HandleResult, HumanAddr, InitResponse, InitResult, LogAttribute, Querier, QueryRequest, QueryResult, StakingMsg, Storage, VoteOption, WasmMsg, StakingQuery, WasmQuery, DistQuery, MintQuery, GovQuery, BondedDenomResponse, AllDelegationsResponse, UnbondingDelegationsResponse, RewardsResponse, InflationResponse, BondedRatioResponse, ProposalsResponse, ValidatorsResponse};

/////////////////////////////// Messages ///////////////////////////////

use schemars::JsonSchema;
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
#[serde(rename_all = "snake_case")]
pub enum Msg {
    Nop {},
    Echo {
        log: Option<Vec<LogAttribute>>,
        data: Option<Binary>,
    },
    BankMsgSend {
        to_address: HumanAddr,
        amount: Vec<Coin>,
    },
    StakingMsgDelegate {
        validator: HumanAddr,
        amount: Coin,
    },
    StakingMsgUndelegate {
        validator: HumanAddr,
        amount: Coin,
    },
    StakingMsgRedelegate {
        src_validator: HumanAddr,
        dst_validator: HumanAddr,
        amount: Coin,
    },
    StakingMsgWithdraw {
        validator: HumanAddr,
        recipient: Option<HumanAddr>,
    },
    GovMsgVote {
        proposal: u64,
        vote_option: VoteOption,
    },
    WasmMsgInstantiate {
        code_id: u64,
        callback_code_hash: String,
        msg: Binary,
        send: Vec<Coin>,
        label: String,
    },
    WasmMsgExecute {
        contract_addr: HumanAddr,
        callback_code_hash: String,
        msg: Binary,
        send: Vec<Coin>,
    },
    CustomMsg {},
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
#[serde(rename_all = "snake_case")]
pub enum QueryMsg {
    BankBalance { address: HumanAddr, denom: String },
    StakingBondedDenom {},
    StakingAllDelegations { delegator: HumanAddr },
    StakingDelegation {
        delegator: HumanAddr,
        validator: HumanAddr,
    },
    StakingValidators {},
    StakingUnbondingDelegations { delegator: HumanAddr },
    WasmSmart {
        contract_addr: HumanAddr,
        callback_code_hash: String,
        msg: Binary,
    },
    WasmRaw {
        contract_addr: HumanAddr,
        key: Binary,
        callback_code_hash: String,
    },
    DistRewards { delegator: HumanAddr },
    MintInflation {},
    MintBondedRatio {},
    GovProposals {},
}

/////////////////////////////// Init ///////////////////////////////

pub fn init<S: Storage, A: Api, Q: Querier>(
    _deps: &mut Extern<S, A, Q>,
    _env: Env,
    _msg: Msg,
) -> InitResult {
    return Ok(InitResponse {
        messages: vec![],
        log: vec![],
    });
}

/////////////////////////////// Handle ///////////////////////////////

pub fn handle<S: Storage, A: Api, Q: Querier>(
    _deps: &mut Extern<S, A, Q>,
    env: Env,
    msg: Msg,
) -> HandleResult {
    match msg {
        Msg::Nop {} => Ok(HandleResponse {
            messages: vec![],
            log: vec![],
            data: None,
        }),
        Msg::Echo { log, data } => Ok(HandleResponse {
            messages: vec![],
            log: log.unwrap_or(vec![]),
            data,
        }),
        Msg::BankMsgSend { to_address, amount } => Ok(HandleResponse {
            messages: vec![CosmosMsg::Bank(BankMsg::Send {
                from_address: env.contract.address,
                to_address,
                amount,
            })],
            log: vec![],
            data: None,
        }),
        Msg::StakingMsgDelegate { validator, amount } => Ok(HandleResponse {
            messages: vec![CosmosMsg::Staking(StakingMsg::Delegate {
                validator,
                amount,
            })],
            log: vec![],
            data: None,
        }),
        Msg::StakingMsgUndelegate { validator, amount } => Ok(HandleResponse {
            messages: vec![CosmosMsg::Staking(StakingMsg::Undelegate {
                validator,
                amount,
            })],
            log: vec![],
            data: None,
        }),
        Msg::StakingMsgRedelegate {
            src_validator,
            dst_validator,
            amount,
        } => Ok(HandleResponse {
            messages: vec![CosmosMsg::Staking(StakingMsg::Redelegate {
                src_validator,
                dst_validator,
                amount,
            })],
            log: vec![],
            data: None,
        }),
        Msg::StakingMsgWithdraw {
            validator,
            recipient,
        } => Ok(HandleResponse {
            messages: vec![CosmosMsg::Staking(StakingMsg::Withdraw {
                validator,
                recipient,
            })],
            log: vec![],
            data: None,
        }),
        Msg::GovMsgVote {
            proposal,
            vote_option,
        } => Ok(HandleResponse {
            messages: vec![CosmosMsg::Gov(GovMsg::Vote {
                proposal,
                vote_option,
            })],
            log: vec![],
            data: None,
        }),
        Msg::WasmMsgInstantiate {
            code_id,
            callback_code_hash,
            msg,
            send,
            label,
        } => Ok(HandleResponse {
            messages: vec![CosmosMsg::Wasm(WasmMsg::Instantiate {
                code_id,
                callback_code_hash,
                msg,
                send,
                label,
            })],
            log: vec![],
            data: None,
        }),
        Msg::WasmMsgExecute {
            contract_addr,
            callback_code_hash,
            msg,
            send,
        } => Ok(HandleResponse {
            messages: vec![CosmosMsg::Wasm(WasmMsg::Execute {
                contract_addr,
                callback_code_hash,
                msg,
                send,
            })],
            log: vec![],
            data: None,
        }),
        Msg::CustomMsg {} => Ok(HandleResponse {
            messages: vec![CosmosMsg::Custom(Empty {})],
            log: vec![],
            data: None,
        }),
    }
}

/////////////////////////////// Query ///////////////////////////////

pub fn query<S: Storage, A: Api, Q: Querier>(deps: &Extern<S, A, Q>, msg: QueryMsg) -> QueryResult {
    match msg {
        QueryMsg::BankBalance { address, denom } => {
            let res =
                deps.querier
                    .query::<BalanceResponse>(&QueryRequest::Bank(BankQuery::Balance {
                        address,
                        denom,
                    }))?;
            return Ok(to_binary(&res)?);
        }
        QueryMsg::StakingBondedDenom {} => {
            let res =
                deps.querier
                    .query::<BondedDenomResponse>(&QueryRequest::Staking(StakingQuery::BondedDenom {}))?;
            return Ok(to_binary(&res)?);
        }
        QueryMsg::StakingAllDelegations { delegator } => {
            let res =
                deps.querier
                    .query::<AllDelegationsResponse>(&QueryRequest::Staking(StakingQuery::AllDelegations {
                        delegator,
                    }))?;

            return Ok(to_binary(&res)?);
        }
        // QueryMsg::StakingDelegation { delegator, validator } => {
        //     let res =
        //         deps.querier
        //             .query::<DelegationResponse>(&QueryRequest::Staking(StakingQuery::Delegation {
        //                 delegator,
        //                 validator,
        //             }))?;
        //
        //     return Ok(to_binary(&res)?);
        // }
        QueryMsg::StakingValidators {} => {
            let res =
                deps.querier
                    .query::<ValidatorsResponse>(&QueryRequest::Staking(StakingQuery::Validators {}))?;

            return Ok(to_binary(&res)?);
        }
        QueryMsg::StakingUnbondingDelegations { delegator } => {
            let res =
                deps.querier
                    .query::<UnbondingDelegationsResponse>(&QueryRequest::Staking(StakingQuery::UnbondingDelegations {
                        delegator,
                    }))?;

            return Ok(to_binary(&res)?);
        }
        // QueryMsg::WasmSmart { contract_addr, callback_code_hash, msg } => {
        //     let res =
        //         deps.querier
        //             .query::<SmartResponse>(&QueryRequest::Wasm(WasmQuery::Smart {
        //                 contract_addr,
        //                 callback_code_hash,
        //                 msg: msg,
        //             }))?;
        //
        //     return Ok(to_binary(&res)?);
        // }
        // QueryMsg::WasmRaw { contract_addr, key, callback_code_hash } => {
        //     let res =
        //         deps.querier
        //             .query::<BalanceResponse>(&QueryRequest::Wasm(WasmQuery::Raw {
        //                 contract_addr,
        //                 key,
        //                 callback_code_hash
        //             }))?;
        //
        //     return Ok(to_binary(&res)?);
        // }
        QueryMsg::DistRewards { delegator } => {
            let res =
                deps.querier
                    .query::<RewardsResponse>(&QueryRequest::Dist(DistQuery::Rewards {
                        delegator,
                    }))?;

            return Ok(to_binary(&res)?);
        }
        QueryMsg::MintInflation {} => {
            let res =
                deps.querier
                    .query::<InflationResponse>(&QueryRequest::Mint(MintQuery::Inflation {}))?;

            return Ok(to_binary(&res)?);
        }
        QueryMsg::MintBondedRatio {} => {
            let res =
                deps.querier
                    .query::<BondedRatioResponse>(&QueryRequest::Mint(MintQuery::BondedRatio {
                    }))?;

            return Ok(to_binary(&res)?);
        }
        QueryMsg::GovProposals {} => {
            let res =
                deps.querier
                    .query::<ProposalsResponse>(&QueryRequest::Gov(GovQuery::Proposals {}))?;

            return Ok(to_binary(&res)?);
        },
        _ => Ok(to_binary("yes")?),
    }
}
