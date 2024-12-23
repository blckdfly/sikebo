const Blockchain = require('./app');
const blockchain = new Blockchain();

testTransaction = {
    "chain": [
        {
            "index": 1,
            "timestamp": 1734786825159,
            "transactions": [],
            "nonce": 100,
            "hash": "0",
            "previousBlockHash": "0"
        },
        {
            "index": 2,
            "timestamp": 1734786875440,
            "transactions": [
                {
                    "name": "Adzin",
                    "status": "Present",
                    "date": "Sat Dec 21, 2024, 20:14:07",
                    "transactionID": "75a60540bf9d11efa8b4c93b10ca3fe7"
                },
                {
                    "name": "Dylan",
                    "status": "Present",
                    "date": "Sat Dec 21, 2024, 20:14:21",
                    "transactionID": "7dfda400bf9d11efa8b4c93b10ca3fe7"
                },
                {
                    "name": "Raymond",
                    "status": "Absent",
                    "date": "Sat Dec 21, 2024, 20:14:27",
                    "transactionID": "814a36f0bf9d11efa8b4c93b10ca3fe7"
                }
            ],
            "nonce": 195438,
            "hash": "0000016b4386bfb60cc45b2e479d7b73e02d3dce8062947c07fa7d4133c5fe738ac332fb16757922c384b542dcc50e35",
            "previousBlockHash": "0"
        },
        {
            "index": 3,
            "timestamp": 1734786903049,
            "transactions": [
                {
                    "name": "PoW System",
                    "status": "Mining Transaction Data",
                    "date": "Sat Dec 21, 2024, 20:14:35",
                    "transactionID": "863d7500bf9d11efbc2445408e08899f"
                },
                {
                    "name": "Naufal",
                    "status": "Absent",
                    "date": "Sat Dec 21, 2024, 20:14:41",
                    "transactionID": "89a53110bf9d11efa8b4c93b10ca3fe7"
                },
                {
                    "name": "Irfan",
                    "status": "Absent",
                    "date": "Sat Dec 21, 2024, 20:14:45",
                    "transactionID": "8c4c0e20bf9d11efa8b4c93b10ca3fe7"
                },
                {
                    "name": "Karli",
                    "status": "Present",
                    "date": "Sat Dec 21, 2024, 20:14:57",
                    "transactionID": "93a01f90bf9d11efa8b4c93b10ca3fe7"
                }
            ],
            "nonce": 45886,
            "hash": "000068cbb5219d1d623769b787200b6da82a6d0554554f12776b26041d8f9dbb9bc3ce841504f49378d87de31c5357a1",
            "previousBlockHash": "0000016b4386bfb60cc45b2e479d7b73e02d3dce8062947c07fa7d4133c5fe738ac332fb16757922c384b542dcc50e35"
        },
        {
            "index": 4,
            "timestamp": 1734787207975,
            "transactions": [
                {
                    "name": "PoW System",
                    "status": "Mining Transaction Data",
                    "date": "Sat Dec 21, 2024, 20:15:03",
                    "transactionID": "96b17e40bf9d11efaed773c2e7299956"
                },
                {
                    "name": "Adzin",
                    "status": "Absent",
                    "date": "Sat Dec 21, 2024, 20:19:53",
                    "transactionID": "440b8b80bf9e11efa8b4c93b10ca3fe7"
                },
                {
                    "name": "Adzin",
                    "status": "Present",
                    "date": "Sat Dec 21, 2024, 20:19:58",
                    "transactionID": "46d22590bf9e11efa8b4c93b10ca3fe7"
                }
            ],
            "nonce": 49131,
            "hash": "000056f32141ea9b98949fbafa6483ac67f7d93a65a720b83d5661fb15ea751c3ccb706830c52bf80a9966043012346d",
            "previousBlockHash": "000068cbb5219d1d623769b787200b6da82a6d0554554f12776b26041d8f9dbb9bc3ce841504f49378d87de31c5357a1"
        }
    ],
    "pendingTransactions": [
        {
            "name": "PoW System",
            "status": "Mining Transaction Data",
            "date": "Sat Dec 21, 2024, 20:20:07",
            "transactionID": "4c6e74e0bf9e11efa8b4c93b10ca3fe7"
        }
    ],
    "currentNodeUrl": "http://localhost:3003",
    "networkNodes": [
        "http://localhost:3002",
        "http://localhost:3001"
    ]
}

console.log("VALID: ", blockchain.chainIsValid(testTransaction.chain));