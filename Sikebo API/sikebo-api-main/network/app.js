const express = require('express');
const cors = require('cors');
const requestPromise = require('request-promise');
const pkg = require('body-parser');

const { json: _json, urlencoded } = pkg;
const { v1: uuid } = require('uuid');

const Blockchain = require('../basic-blockchain/app');

const app = express();
const port = 3000;

const blockchain = new Blockchain();
const nodeAddress = uuid().split('-').join('');

app.use(cors());
app.use(_json());
app.use(urlencoded({ extended: false }));

app.get('/', (_req, res) => {
    res.send('Sikebo API - Sistem Kehadiran Berbasis Blockchain');
});

app.get('/blockchain', (_req, res) => {
    res.send(blockchain);
});

app.post('/transaction', function (req, res) {
    const newTransaction = req.body;
    const blockIndex = blockchain.addTransactionToPendingTransactions(newTransaction);
    res.json({ note: `Transaction will be added in block ${blockIndex}.` });
});

app.post('/transaction/broadcast', function(req, res) {
    const newTransaction = blockchain.createNewTransaction(req.body.userID, req.body.status);
    blockchain.addTransactionToPendingTransactions(newTransaction);

    const requestPromises = [];
    blockchain.networkNodes.forEach(networkNodeUrl => {
        const requestOptions = {
            uri: networkNodeUrl + '/transaction',
            method: 'POST',
            body: newTransaction,
            json: true
        };
        requestPromises.push(requestPromise(requestOptions));
    });

    Promise.all(requestPromises).then(data => {
        res.json({note: 'Transaction created and broadcast successfully.'});
    });
});

app.get('/mine',function(req,res){
    const LastBlock = blockchain.getLastBlock();
    const previousBlockHash = LastBlock['hash'];
    const currentBlockData = {
        transactions: blockchain.pendingTransactions,
        index: LastBlock['index'] + 1
    }
    const nonce = blockchain.proofOfWork(previousBlockHash, currentBlockData);
    const blockHash = blockchain.hashBlock(previousBlockHash, currentBlockData, nonce);
    const newBlock =blockchain.createNewBlock(nonce, previousBlockHash, blockHash);

    const requestPromises = [];
    blockchain.networkNodes.forEach(networkNodeUrl => {
        const requestOptions = {
            uri: networkNodeUrl + '/receive-new-block',
            method: 'POST',
            body: { newBlock: newBlock },
            json: true
        };
        requestPromises.push(requestPromise(requestOptions));
    });

    Promise.all(requestPromises).then(data => {
        const requestOptions = {
            uri: blockchain.currentNodeUrl + '/transaction/broadcast',
            method: 'POST',
            body: {
                userID: "0x - PoW System",
                status: "Mining Transaction Data"
            },
            json: true
        };
        return requestPromise(requestOptions);
    }).then(data => {
        res.json({
            note: "New Block mined Successfully",
            block: newBlock
        });
    })
});

app.post('/receive-new-block', function(req, res){
    const newBlock = req.body.newBlock;
    const lastBlock = blockchain.getLastBlock();
    const correctHash = lastBlock.hash == newBlock.previousBlockHash;
    const correctIndex = lastBlock['index']+1 == newBlock['index'];

    if ( correctHash && correctIndex ){
        blockchain.chain.push(newBlock);
        blockchain.pendingTransactions = [];
        res.json({
            note: "New block received and accepted.",
            newBlock: newBlock
        });
    } else{
        res.json({
            note: 'New block rejected.',
            newBlock: newBlock
        });
    }
});

app.post('/register-and-broadcast-node',function(req,res){
    const newNodeUrl = req.body.newNodeUrl;
    if(blockchain.networkNodes.indexOf(newNodeUrl) == -1) blockchain.networkNodes.push(newNodeUrl);

    const regNodesPromises = [];
    blockchain.networkNodes.forEach(networkNodeUrl => {
        const requestOptions = {
            uri:networkNodeUrl + '/register-node',
            method: 'POST', 
            body: { newNodeUrl: newNodeUrl },
            json: true 
        };
        regNodesPromises.push(requestPromise(requestOptions));
    });
    Promise.all(regNodesPromises).then(data => {
        const bulkRegisterOptions = {
            uri: newNodeUrl + '/register-nodes-bulk',
            method: 'POST',
            body: { allNetworkNodes: [ ...blockchain.networkNodes, blockchain.currentNodeUrl] },
            json: true
        };
        return requestPromise(bulkRegisterOptions);
    }).then(data => {
        res.json ({ note: 'New node registered with network successfully.'});
    });
});

app.post('/register-node', function(req,res){
    const newNodeUrl = req.body.newNodeUrl;
    const nodeNotAlreadyPresent = blockchain.networkNodes.indexOf(newNodeUrl) == -1;
    const notCurrentNode = blockchain.currentNodeUrl !== newNodeUrl;
    if (nodeNotAlreadyPresent && notCurrentNode) blockchain.networkNodes.push(newNodeUrl);
    res.json({ note: 'New node registered successfully with node.'});
});

app.post('/register-nodes-bulk', function(req,res){
    const allNetworkNodes = req.body.allNetworkNodes;
    allNetworkNodes.forEach(networkNodeUrl => {
        const nodeNotAlreadyPresent = blockchain.networkNodes.indexOf(networkNodeUrl) == -1;
        const notCurrentNode =blockchain.currentNodeUrl !== networkNodeUrl;
        if (nodeNotAlreadyPresent && notCurrentNode) blockchain.networkNodes.push(networkNodeUrl);
    });
    res.json({ note:'Bulk registration successful.'});
});

app.get('/consensus', function(req, res){
    const requestPromises = [];
    blockchain.networkNodes.forEach(networkodeurl => {
        const requestOptions = {
            uri: networkodeurl + '/blockchain',  
            method: 'GET',
            json: true
        };
        requestPromises.push(requestPromise(requestOptions));
    });
    Promise.all(requestPromises).then(blockchains => {
        const currentChainLength = blockchain.chain.length;
        let maxChainLength = currentChainLength;
        let newLongestChain = null;
        let newPendingTransactions = null;

        blockchains.forEach(blockchain => {
            if(blockchain.chain.length > maxChainLength){
                maxChainLength = blockchain.chain.length;
                newLongestChain = blockchain.chain;
            newPendingTransactions = blockchain.pendingTransactions;
            };
        });

        if (!newLongestChain || (newLongestChain && !blockchain.chainIsValid(newLongestChain))){
            res.json({
                note: 'Current chain has not been replaced.',
                chain: blockchain.chain
            });
        } else if (newLongestChain && blockchain.chainIsValid(newLongestChain)){
            blockchain.chain = newLongestChain;
            blockchain.pendingTransactions = newPendingTransactions;
            res.json({
                note: 'This chain has been replaced.',
                chain: blockchain.chain
            });
        }
    });
});

app.get('/block/:blockHash', function(req,res){ 
    const blockHash = req.params.blockHash;
    const correctBlock = blockchain.getBlock(blockHash);
    res.json({
        block: correctBlock 
    })
});


app.get('/transaction/:transactionId', function(req,res){
    const transactionId = req.params.transactionId;
    const transactionData = blockchain.getTransaction(transactionId);
    res.json({
        transaction: transactionData.transaction, 
        block: transactionData.block 
    })
});

app.get('/address/:address', function(req,res) {
    const address =req.params.address;
    const addressData = blockchain.getAddressData(address);
    res.json({
        addressData: addressData 
    });
});

app.get('/block-explorer',function(req, res) {
    res.sendFile('index.html', { root: './block-explorer' });
});

app.listen(port, () => {
    console.log(`Sikebo API running on port ${port}`);
});