(window.webpackJsonp=window.webpackJsonp||[]).push([[20],{366:function(e,t,o){"use strict";o.r(t);var r=o(43),s=Object(r.a)({},(function(){var e=this,t=e.$createElement,o=e._self._c||t;return o("ContentSlotsDistributor",{attrs:{"slot-key":e.$parent.slotKey}},[o("h1",{attrs:{id:"components"}},[o("a",{staticClass:"header-anchor",attrs:{href:"#components"}},[e._v("#")]),e._v(" Components")]),e._v(" "),o("p",[e._v("This section provides an overview of Secret Network, component by component. For more information, please refer to specific pages which go into more detail.")]),e._v(" "),o("p",[o("img",{attrs:{src:"/diagrams/secret-network.png",alt:"network"}})]),e._v(" "),o("h2",{attrs:{id:"validators"}},[o("a",{staticClass:"header-anchor",attrs:{href:"#validators"}},[e._v("#")]),e._v(" Validators")]),e._v(" "),o("p",[e._v("The Secret Network validators are responsible for proposing new blocks to the blockchain, and confirming blocks proposed by other validators. A validator is a full node that can also propose and sign blocks. Validators must have adequate infrastructure to prevent downtime. Everyone who holds SCRT, however, can be a delegator. Delegators can delegate to validators they believe will maintain proper uptime, and will grow the blockchain through governance in what delegators feel is the right direction. Validators perform all the requested computations in each block via the "),o("code",[e._v("compute")]),e._v(" module, which means all computations also occur as part of the consensus process. Validators run Intel SGX chips, and have gone through "),o("RouterLink",{attrs:{to:"/protocol/sgx.html#remote-attestation"}},[e._v("remote attestation")]),e._v(", a process by which Intel SGX chips are verified. It will have also successfully completed a network registration process. As part of registration the validators are provisioned with the secret keys they need to participate in private computations. Validators run the Secret Network code, and execute WASM  code within a TEE. They are responsible for achieving consensus on computation results, and proposing and/or validating new blocks in the Secret Network’s blockchain. Validators also participate in "),o("RouterLink",{attrs:{to:"/protocol/governance.html"}},[e._v("governance")]),e._v(".")],1),e._v(" "),o("h2",{attrs:{id:"secret-contracts"}},[o("a",{staticClass:"header-anchor",attrs:{href:"#secret-contracts"}},[e._v("#")]),e._v(" Secret Contracts")]),e._v(" "),o("p",[e._v("Secret contracts are code which executes over encrypted data. Secret contracts are currently written in Rust (though this could be potentially expanded in the future to include AssemblyScript), and compile to WASM. Secret contracts are public while the data they execute over is not. This enables users to have confidence that contracts will perform as functioned, while simultaneously ensuring that the data users submit cannot be viewed by any counterparty.")]),e._v(" "),o("p",[e._v("Contracts are stored on the Secret blockchain, where their code is publicly available. They execute inside the trusted part of Secret Network.")]),e._v(" "),o("h2",{attrs:{id:"modules"}},[o("a",{staticClass:"header-anchor",attrs:{href:"#modules"}},[e._v("#")]),e._v(" Modules")]),e._v(" "),o("p",[e._v("The Secret Network blockchain currently contains the following modules. For a full description of each module, click to view module code.")]),e._v(" "),o("ul",[o("li",[o("a",{attrs:{href:"https://github.com/cosmos/cosmos-sdk/tree/v0.38.3/x/auth",target:"_blank",rel:"noopener noreferrer"}},[e._v("auth"),o("OutboundLink")],1)]),e._v(" "),o("li",[o("a",{attrs:{href:"https://github.com/cosmos/cosmos-sdk/tree/v0.38.3/x/auth/vesting",target:"_blank",rel:"noopener noreferrer"}},[e._v("vesting"),o("OutboundLink")],1)]),e._v(" "),o("li",[o("a",{attrs:{href:"https://github.com/cosmos/cosmos-sdk/tree/v0.38.3/x/bank",target:"_blank",rel:"noopener noreferrer"}},[e._v("bank"),o("OutboundLink")],1)]),e._v(" "),o("li",[o("a",{attrs:{href:"https://github.com/cosmos/cosmos-sdk/tree/v0.38.3/x/crisis",target:"_blank",rel:"noopener noreferrer"}},[e._v("crisis"),o("OutboundLink")],1)]),e._v(" "),o("li",[o("a",{attrs:{href:"https://github.com/cosmos/cosmos-sdk/tree/v0.38.3/x/distribution",target:"_blank",rel:"noopener noreferrer"}},[e._v("distribution"),o("OutboundLink")],1)]),e._v(" "),o("li",[o("a",{attrs:{href:"https://github.com/cosmos/cosmos-sdk/tree/v0.38.3/x/evidence",target:"_blank",rel:"noopener noreferrer"}},[e._v("evidence"),o("OutboundLink")],1)]),e._v(" "),o("li",[o("a",{attrs:{href:"https://github.com/cosmos/cosmos-sdk/tree/v0.38.3/x/genutil",target:"_blank",rel:"noopener noreferrer"}},[e._v("genutil"),o("OutboundLink")],1)]),e._v(" "),o("li",[o("a",{attrs:{href:"https://github.com/cosmos/cosmos-sdk/tree/v0.38.3/x/gov",target:"_blank",rel:"noopener noreferrer"}},[e._v("gov"),o("OutboundLink")],1)]),e._v(" "),o("li",[o("a",{attrs:{href:"https://github.com/cosmos/cosmos-sdk/tree/v0.38.3/x/mint",target:"_blank",rel:"noopener noreferrer"}},[e._v("mint"),o("OutboundLink")],1)]),e._v(" "),o("li",[o("a",{attrs:{href:"https://github.com/cosmos/cosmos-sdk/tree/v0.38.3/x/params",target:"_blank",rel:"noopener noreferrer"}},[e._v("params"),o("OutboundLink")],1)]),e._v(" "),o("li",[o("a",{attrs:{href:"https://github.com/cosmos/cosmos-sdk/tree/v0.38.3/x/params/client",target:"_blank",rel:"noopener noreferrer"}},[e._v("params client"),o("OutboundLink")],1)]),e._v(" "),o("li",[o("a",{attrs:{href:"https://github.com/cosmos/cosmos-sdk/tree/v0.38.3/x/slashing",target:"_blank",rel:"noopener noreferrer"}},[e._v("slashing"),o("OutboundLink")],1)]),e._v(" "),o("li",[o("a",{attrs:{href:"https://github.com/cosmos/cosmos-sdk/tree/v0.38.3/x/staking",target:"_blank",rel:"noopener noreferrer"}},[e._v("staking"),o("OutboundLink")],1)]),e._v(" "),o("li",[o("a",{attrs:{href:"https://github.com/cosmos/cosmos-sdk/tree/v0.38.3/x/supply",target:"_blank",rel:"noopener noreferrer"}},[e._v("supply"),o("OutboundLink")],1)]),e._v(" "),o("li",[o("a",{attrs:{href:"https://github.com/cosmos/cosmos-sdk/tree/v0.38.3/x/upgrade",target:"_blank",rel:"noopener noreferrer"}},[e._v("upgrade"),o("OutboundLink")],1)]),e._v(" "),o("li",[o("a",{attrs:{href:"https://github.com/cosmos/cosmos-sdk/tree/v0.38.3/x/upgrade/client",target:"_blank",rel:"noopener noreferrer"}},[e._v("upgrade client"),o("OutboundLink")],1)])]),e._v(" "),o("h2",{attrs:{id:"compute-module"}},[o("a",{staticClass:"header-anchor",attrs:{href:"#compute-module"}},[e._v("#")]),e._v(" Compute Module")]),e._v(" "),o("p",[e._v("Enigma is currently implementing the "),o("code",[e._v("compute")]),e._v(" module, or "),o("code",[e._v("x/compute")]),e._v(" for the Secret Network. This module will enable secret contract functionality, including encryption and decryption of state, as well as encrypted input/outputs for users.")]),e._v(" "),o("p",[o("img",{attrs:{src:"/diagrams/module-map.png",alt:"modules"}})]),e._v(" "),o("h2",{attrs:{id:"client-library"}},[o("a",{staticClass:"header-anchor",attrs:{href:"#client-library"}},[e._v("#")]),e._v(" Client Library")]),e._v(" "),o("p",[e._v("The Secret Network client library is an API included in decentralized applications that enables them to easily communicate with secret contracts on the Secret blockchain. This component is still under development, but will most likely be built on top of CosmWasmJS, and include novel functions for specific tasks.")]),e._v(" "),o("h2",{attrs:{id:"bootstrap-node"}},[o("a",{staticClass:"header-anchor",attrs:{href:"#bootstrap-node"}},[e._v("#")]),e._v(" Bootstrap Node")]),e._v(" "),o("p",[e._v("The bootstrap node is the first node to join the network. It is identical to other nodes, but is responsible for certain initialization processes.")])])}),[],!1,null,null,null);t.default=s.exports}}]);