import React, { useState, useEffect } from "react";
import { Clock, AlertCircle, ChevronRight } from "lucide-react";
import axios from 'axios';

const API_CONFIG = {
  endpoints: [
    "https://sikebo-node1.binusbcc.org/",
    "https://sikebo-node2.binusbcc.org/",
    "https://sikebo-node3.binusbcc.org/"
  ]
};

const Card = ({ children, className }) => (
  <div className={`rounded-lg shadow-md ${className}`}>{children}</div>
);

const CardHeader = ({ children }) => (
  <div className="border-b p-4 bg-gray-100">{children}</div>
);

const CardTitle = ({ children, className }) => (
  <h3 className={`text-lg font-bold ${className}`}>{children}</h3>
);

const CardContent = ({ children, className }) => (
  <div className={`p-4 ${className}`}>{children}</div>
);

const Dashboard = () => {
  const [time, setTime] = useState(new Date());
  const [employeeId, setEmployeeId] = useState("");
  const [searchId, setSearchId] = useState("");
  const [blocks, setBlocks] = useState([]);
  const [searchResults, setSearchResults] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [miningStatus] = useState("");
  const [isLoading, setIsLoading] = useState(false);  // Proper useState dengan getter dan setter

  const [currentEndpointIndex, setCurrentEndpointIndex] = useState(0);

  const testData = [
    {
      index: 1,
      timestamp: "2024-12-23T00:00:00",
      nonce: 12345,
      hash: "abcdef123456",
      previousBlockHash: "xyz123",
      merkleRoot: "roothash123",
      transactions: [
        {
          employeeId: "EMP001",
          transactionId: "TX12345"
        }
      ]
    }
  ];

  const transformData = (apiData) => {
    const { chain, pendingTransactions } = apiData;
  
    // Transform chain blocks
    const transformedBlocks = chain.map((block) => {
      const transactions = pendingTransactions.map((tx) => ({
        employeeId: tx.userID, // Map userID ke employeeId
        transactionId: tx.transactionID, // Ambil transactionID
      }));
  
      return {
        index: block.index,
        timestamp: new Date(block.timestamp).toLocaleString(), // Convert timestamp
        nonce: block.nonce,
        hash: block.hash,
        previousBlockHash: block.previousBlockHash,
        merkleRoot: block.merkleRoot || "N/A", // Jika tidak ada merkleRoot, tampilkan "N/A"
        transactions, // Masukkan transaksi
      };
    });
  
    return transformedBlocks;
  };
  
  
  // useEffect(() => {
  //   setSearchResults(testData);
  // }, []);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('https://sikebo-node1.binusbcc.org/blockchain');
        const data = await response.json();
        setBlocks(data);
        if (data.chain) {
          setSearchResults(transformData(data));
        }
      } catch (error) {
        console.error('Error:', error);
      }
    };
  
    fetchData();
  }, []);


  const formattedTime = time.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).split(":").join(".");

  const formattedDate = time.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric"
  });

  const retryRequest = async (fn, retries = 3, delay = 1000) => {
    try {
      return await fn();
    } catch (error) {
      if (retries === 0) throw error;
      await new Promise((res) => setTimeout(res, delay));
      return retryRequest(fn, retries - 1, delay);
    }
  };

  const handleClockIn = async () => {
    if (!employeeId) {
      setErrorMessage("Please enter your Employee ID");
      return;
    }
  
    const today = new Date().toDateString();
    const blockchainData = blocks?.chain || [];
    
    const alreadyClockedIn = blockchainData.some(block => 
      block?.transactions?.[0]?.userID === employeeId && 
      new Date(block.timestamp).toDateString() === today
    );
  
    if (alreadyClockedIn) {
      setErrorMessage("Already clocked in today");
      return;
    }
  
    setIsLoading(true);
    setErrorMessage("");
  
    try {
      const endpoint = API_CONFIG.endpoints[currentEndpointIndex];
      const response = await axios.post(`${endpoint}transaction/broadcast`, {
        userID: employeeId,
        status: "Clock In"
      });
  
      // Fetch updated blockchain data
      const updatedData = await axios.get(`${endpoint}blockchain`);
      setBlocks(updatedData.data);
      setSearchResults(transformData(updatedData.data));
      
      setEmployeeId("");
      setCurrentEndpointIndex((currentEndpointIndex + 1) % API_CONFIG.endpoints.length);
    } catch (error) {
      setErrorMessage(error.response?.data?.message || "Clock in failed");
    } finally {
      setIsLoading(false);
    }
  };

  // const handleSearch = async (e) => {
  //   e.preventDefault();
  //   setIsLoading(true);
  //   setErrorMessage("");

  //   try {
  //     const endpoint = API_CONFIG.endpoints[currentEndpointIndex];
  //     const url = filterType === "id" && searchId
  //       ? `${endpoint}transaction/${searchId}`
  //       : `${endpoint}blockchain`;

  //     console.log("Fetching URL:", url); // Tambahkan ini untuk debug

  //     const results = await axios.get(url);

  //     console.log('Status:', results.status); // Cek status
  //     if (results.status === 200) {
  //       setSearchResults(results.data);
  //     } else {
  //       setErrorMessage("Failed to fetch data.");
  //     }

  //     console.log('Results:', results.data); // Cek data yang datang

  //     setSearchResults(results.data);
  //   } catch (error) {
  //     setErrorMessage("Error fetching blocks: " + error.message);
  //   } finally {
  //     setIsLoading(false);
  //   }
  // };

  const handleSearch = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage("");
  
    try {
      const endpoint = API_CONFIG.endpoints[currentEndpointIndex];
      const url = filterType === "id" && searchId
        ? `${endpoint}transaction/${searchId}`
        : `${endpoint}blockchain`;
  
      console.log("Fetching URL:", url); // Debug log
  
      const response = await axios.get(url);
      const transformedData = transformData(response.data); // Transform data
      console.log("Transformed Data:", transformedData); // Debug log untuk cek hasil transformasi
  
      setSearchResults(transformedData); // Set data ke state
    } catch (err) {
      console.error("Error fetching data:", err);
      setErrorMessage("Failed to fetch data");
    } finally {
      setIsLoading(false);
    }
  };
  

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2 bg-emerald-800 text-white">
          <CardContent className="p-8">
            <h2 className="text-lg font-medium">Hi👋</h2>
            <h1 className="text-4xl font-bold mb-8">Lets go to Work!</h1>

            <div className="mb-8">
              <h1 className="text-6xl font-bold">{formattedTime}</h1>
              <p className="text-xl mt-2">{formattedDate}</p>
            </div>

            <div className="space-y-4">
              <input
                type="text"
                className="w-full p-3 bg-emerald-700/50 rounded-lg text-white placeholder-white/70"
                placeholder="Enter your Employee ID"
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
              />
              {errorMessage && (
                <div className="text-red-300 text-sm">{errorMessage}</div>
              )}
              {miningStatus && (
                <div className="text-lime-300 text-sm">{miningStatus}</div>
              )}
              <button
                onClick={handleClockIn}
                className="w-full bg-lime-400 text-emerald-900 p-4 rounded-lg flex items-center justify-center space-x-2 font-medium hover:bg-lime-300 transition-colors"
              >
                <Clock className="w-5 h-5" />
                <span>Clock In</span>
              </button>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-emerald-800 text-white">
          <CardContent className="p-8">
            <h3 className="text-2xl font-bold mb-2">Attendance</h3>
            <p className="text-lg mb-6">December</p>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-indigo-100 p-4 rounded-lg text-indigo-900">
                <span className="text-3xl font-bold block">13</span>
                <span className="text-sm">On-time Arrivals</span>
              </div>
              <div className="bg-red-100 p-4 rounded-lg text-red-900">
                <span className="text-3xl font-bold block">4</span>
                <span className="text-sm">Missed Days</span>
              </div>
              <div className="bg-rose-100 p-4 rounded-lg text-rose-900">
                <span className="text-3xl font-bold block">9</span>
                <span className="text-sm">Delayed Check-Ins</span>
              </div>
              <div className="bg-amber-100 p-4 rounded-lg text-amber-900">
                <span className="text-3xl font-bold block">8</span>
                <span className="text-sm">Total Leaves</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3 bg-emerald-800 text-white">
          <CardContent className="p-8">
            <h3 className="text-2xl font-bold mb-6">Announcements</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-emerald-700/50 rounded-lg">
                <div>
                  <h4 className="font-medium">Holiday Leave Submission</h4>
                  <p className="text-sm text-white/70">December 18, 2024</p>
                </div>
                <ChevronRight className="w-5 h-5" />
              </div>
              <div className="flex items-center justify-between p-4 bg-emerald-700/50 rounded-lg">
                <div>
                  <h4 className="font-medium">Wellness Wednesday</h4>
                  <p className="text-sm text-white/70">December 13, 2024</p>
                </div>
                <ChevronRight className="w-5 h-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="text-2xl font-bold">Blockchain Attendance Records</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSearch} className="flex gap-4 mb-8">
              <select
                className="p-3 border rounded-lg bg-white"
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
              >
                <option value="all">All Blocks</option>
                <option value="id">Search by Employee ID</option>
              </select>
              {filterType === "id" && (
                <input
                  type="text"
                  className="flex-1 p-3 border rounded-lg"
                  value={searchId}
                  onChange={(e) => setSearchId(e.target.value)}
                  placeholder="Enter Employee ID"
                />
              )}
              <button
                type="submit"
                className="px-6 py-3 bg-emerald-800 text-white rounded-lg hover:bg-emerald-700"
              >
                Search
              </button>
            </form>

            {searchResults && searchResults.length === 0 && (
              <div className="text-center p-8 bg-gray-50 rounded-lg">
                <AlertCircle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-500">No blocks found</p>
              </div>
            )}

            {searchResults && searchResults.length > 0 && (
              <div className="border rounded-lg overflow-hidden">
                <h3 className="p-4 bg-gray-50 font-medium border-b">Blockchain History</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="p-4 text-left">Block Index</th>
                        <th className="p-4 text-left">Employee ID</th>
                        <th className="p-4 text-left">Timestamp</th>
                        <th className="p-4 text-left">Nonce</th>
                        <th className="p-4 text-left">Block Hash</th>
                        <th className="p-4 text-left">Previous Hash</th>
                        <th className="p-4 text-left">Merkle Root</th>
                        <th className="p-4 text-left">Transaction Hash</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      
                      {searchResults.map((block) => (
                        <tr key={block.index}>
                          <td className="p-4">{block.index}</td>
                          <td className="p-4">{block.transactions[0].employeeId}</td>
                          <td className="p-4">
                            {new Date(block.timestamp).toLocaleString()}
                          </td>
                          <td className="p-4">{block.nonce}</td>
                          <td className="p-4 font-mono text-sm truncate max-w-xs">
                            {block.hash}
                          </td>
                          <td className="p-4 font-mono text-sm truncate max-w-xs">
                            {block.previousBlockHash}
                          </td>
                          <td className="p-4 font-mono text-sm truncate max-w-xs">
                            {block.merkleRoot}
                          </td>
                          <td className="p-4 font-mono text-sm truncate max-w-xs">
                            {block.transactions[0].transactionId}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
