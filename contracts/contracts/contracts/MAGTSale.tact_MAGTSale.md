# Tact compilation report
Contract: MAGTSale
BoC Size: 2014 bytes

## Structures (Structs and Messages)
Total structures: 17

### DataSize
TL-B: `_ cells:int257 bits:int257 refs:int257 = DataSize`
Signature: `DataSize{cells:int257,bits:int257,refs:int257}`

### SignedBundle
TL-B: `_ signature:fixed_bytes64 signedData:remainder<slice> = SignedBundle`
Signature: `SignedBundle{signature:fixed_bytes64,signedData:remainder<slice>}`

### StateInit
TL-B: `_ code:^cell data:^cell = StateInit`
Signature: `StateInit{code:^cell,data:^cell}`

### Context
TL-B: `_ bounceable:bool sender:address value:int257 raw:^slice = Context`
Signature: `Context{bounceable:bool,sender:address,value:int257,raw:^slice}`

### SendParameters
TL-B: `_ mode:int257 body:Maybe ^cell code:Maybe ^cell data:Maybe ^cell value:int257 to:address bounce:bool = SendParameters`
Signature: `SendParameters{mode:int257,body:Maybe ^cell,code:Maybe ^cell,data:Maybe ^cell,value:int257,to:address,bounce:bool}`

### MessageParameters
TL-B: `_ mode:int257 body:Maybe ^cell value:int257 to:address bounce:bool = MessageParameters`
Signature: `MessageParameters{mode:int257,body:Maybe ^cell,value:int257,to:address,bounce:bool}`

### DeployParameters
TL-B: `_ mode:int257 body:Maybe ^cell value:int257 bounce:bool init:StateInit{code:^cell,data:^cell} = DeployParameters`
Signature: `DeployParameters{mode:int257,body:Maybe ^cell,value:int257,bounce:bool,init:StateInit{code:^cell,data:^cell}}`

### StdAddress
TL-B: `_ workchain:int8 address:uint256 = StdAddress`
Signature: `StdAddress{workchain:int8,address:uint256}`

### VarAddress
TL-B: `_ workchain:int32 address:^slice = VarAddress`
Signature: `VarAddress{workchain:int32,address:^slice}`

### BasechainAddress
TL-B: `_ hash:Maybe int257 = BasechainAddress`
Signature: `BasechainAddress{hash:Maybe int257}`

### Deploy
TL-B: `deploy#946a98b6 queryId:uint64 = Deploy`
Signature: `Deploy{queryId:uint64}`

### DeployOk
TL-B: `deploy_ok#aff90f57 queryId:uint64 = DeployOk`
Signature: `DeployOk{queryId:uint64}`

### FactoryDeploy
TL-B: `factory_deploy#6d0ff13b queryId:uint64 cashback:address = FactoryDeploy`
Signature: `FactoryDeploy{queryId:uint64,cashback:address}`

### Level
TL-B: `_ tokens:int257 price:int257 = Level`
Signature: `Level{tokens:int257,price:int257}`

### LevelInfo
TL-B: `_ level:int257 remaining:int257 totalSold:int257 = LevelInfo`
Signature: `LevelInfo{level:int257,remaining:int257,totalSold:int257}`

### RefQuery
TL-B: `_ exists:bool ref:address = RefQuery`
Signature: `RefQuery{exists:bool,ref:address}`

### MAGTSale$Data
TL-B: `_ owner:address magtMinter:address saleJW:address magtDecimals:int257 levels:dict<int, ^Level{tokens:int257,price:int257}> currentLevel:int257 remainingInLevel:int257 totalSoldHuman:int257 refPoolLeftHuman:int257 refOf:dict<address, address> = MAGTSale`
Signature: `MAGTSale{owner:address,magtMinter:address,saleJW:address,magtDecimals:int257,levels:dict<int, ^Level{tokens:int257,price:int257}>,currentLevel:int257,remainingInLevel:int257,totalSoldHuman:int257,refPoolLeftHuman:int257,refOf:dict<address, address>}`

## Get methods
Total get methods: 4

## get_owner
No arguments

## get_level
No arguments

## get_ref_pool_left
No arguments

## get_referrer
Argument: addr

## Exit codes
* 2: Stack underflow
* 3: Stack overflow
* 4: Integer overflow
* 5: Integer out of expected range
* 6: Invalid opcode
* 7: Type check error
* 8: Cell overflow
* 9: Cell underflow
* 10: Dictionary error
* 11: 'Unknown' error
* 12: Fatal error
* 13: Out of gas error
* 14: Virtualization error
* 32: Action list is invalid
* 33: Action list is too long
* 34: Action is invalid or not supported
* 35: Invalid source address in outbound message
* 36: Invalid destination address in outbound message
* 37: Not enough Toncoin
* 38: Not enough extra currencies
* 39: Outbound message does not fit into a cell after rewriting
* 40: Cannot process a message
* 41: Library reference is null
* 42: Library change action error
* 43: Exceeded maximum number of cells in the library or the maximum depth of the Merkle tree
* 50: Account state size exceeded limits
* 128: Null reference exception
* 129: Invalid serialization prefix
* 130: Invalid incoming message
* 131: Constraints error
* 132: Access denied
* 133: Contract stopped
* 134: Invalid argument
* 135: Code of a contract was not found
* 136: Invalid standard address
* 138: Not a basechain address
* 1242: REF_NOT_SET
* 7126: NO_TON
* 17803: LEVEL_OOB
* 19276: LEVEL_MISSING
* 30094: BAD_OP
* 30229: LEVEL_NULL
* 37401: ZERO_OUTPUT
* 43904: LOW_PAYMENT
* 53246: LEVEL_NULL_2

## Trait inheritance diagram

```mermaid
graph TD
MAGTSale
MAGTSale --> BaseTrait
MAGTSale --> Deployable
Deployable --> BaseTrait
```

## Contract dependency diagram

```mermaid
graph TD
MAGTSale
```