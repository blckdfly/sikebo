import React, { useState, useEffect } from "react";
import { Clock, AlertCircle, ChevronRight } from "lucide-react";
import axios from 'axios';

const API_CONFIG = {
  endpoints: [
    "https://sikebo-node1.binusbcc.org/",
    "https://sikebo-node2.binusbcc.org/",
    "https://sikebo-node3.binusbcc.org/"
  ],
  timeout: 5000,
  retries: 2
};

const api = axios.create({
  timeout: API_CONFIG.timeout,
  headers: {
    'Content-Type': 'application/json'
  }
});

const retryRequest = async (fn, retries = API_CONFIG.retries) => {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === retries - 1) throw error;
      
      const currentEndpoint = error.config.url;
      const currentIndex = API_CONFIG.endpoints.indexOf(new URL(currentEndpoint).origin + '/');
      const nextIndex = (currentIndex + 1) % API_CONFIG.endpoints.length;
      error.config.url = error.config.url.replace(
        API_CONFIG.endpoints[currentIndex],
        API_CONFIG.endpoints[nextIndex]
      );
      
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
    }
  }
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
  const [setIsLoading] = useState(false);
  const [currentEndpointIndex, setCurrentEndpointIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
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

  const handleClockIn = async () => {
    if (!employeeId) {
      setErrorMessage("Please enter your Employee ID");
      return;
    }

    const today = new Date().toDateString();
    const alreadyClockedIn = blocks.some(block => 
      block.transactions[0].employeeId === employeeId && 
      new Date(block.timestamp).toDateString() === today
    );

    if (alreadyClockedIn) {
      setErrorMessage("You have already clocked in today");
      return;
    }

    setIsLoading(true);
    setErrorMessage("");

    try {
      const response = await retryRequest(async () => {
        const endpoint = API_CONFIG.endpoints[currentEndpointIndex];
        const result = await api.post(`${endpoint}clock-in`, {
          employeeId,
          timestamp: new Date().toISOString(),
          type: "Clock In"
        });
        return result;
      });

      const newBlock = response.data;
      setBlocks([...blocks, newBlock]);
      setEmployeeId("");
      setErrorMessage("");
      
      // Update to next endpoint for load balancing
      setCurrentEndpointIndex((currentEndpointIndex + 1) % API_CONFIG.endpoints.length);
    } catch (error) {
      let errorMsg = "An error occurred while clocking in. ";
      
      if (error.code === "ECONNABORTED") {
        errorMsg += "Request timed out. Please try again.";
      } else if (!navigator.onLine) {
        errorMsg += "Please check your internet connection.";
      } else if (error.response) {
        // Server responded with error
        errorMsg += error.response.data.message || "Server error occurred.";
      } else if (error.request) {
        // Request made but no response
        errorMsg += "Could not reach the server. Please try again later.";
      } else {
        errorMsg += "Please try again or contact support if the problem persists.";
      }
      
      setErrorMessage(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

const handleSearch = async (e) => {
  e.preventDefault();
  
  try {
      let results;
      
      if (filterType === "id" && searchId) {
          results = await axios.get(`${API_CONFIG[0]}search`, {
              params: { employeeId: searchId }
          });
      } else {
          results = await axios.get(`${API_CONFIG[0]}all-blocks`);
      }

      setSearchResults(results.data);
  } catch (error) {
      setErrorMessage("Error fetching blocks: " + error.message);
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