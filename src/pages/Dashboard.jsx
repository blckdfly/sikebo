import React, { useState, useEffect } from "react";
import { ChevronRight } from "lucide-react";
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

const CardContent = ({ children, className }) => (
  <div className={`p-4 ${className}`}>{children}</div>
);

const Dashboard = () => {
  const [time, setTime] = useState(new Date());
  const [userID, setUserID] = useState("");
  const [blocks, setBlocks] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [miningStatus] = useState("");

  const [currentEndpointIndex, setCurrentEndpointIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
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

  const handleTransaction = async (status) => {
    if (status !== "Mine" && !userID) {
      setErrorMessage("Please enter your User ID");
      return;
    }

    if (status === "Mine") {
      setErrorMessage("");
      try {
        const endpoint = API_CONFIG.endpoints[currentEndpointIndex];
        const response = await axios.get(`${endpoint}mine`);
        alert(response.data.note);
        setCurrentEndpointIndex((currentEndpointIndex + 1) % API_CONFIG.endpoints.length);
      } catch (error) {
        setErrorMessage(error.response?.data?.message || "Mine failed");
      }
      return;
    }

    const today = new Date().toDateString();
    const blockchainData = blocks?.chain || [];

    const alreadyActioned = blockchainData.some(block => 
      block?.transactions?.[0]?.userID === userID && 
      new Date(block.timestamp).toDateString() === today
    );

    if (alreadyActioned && status !== "Mine") {
      setErrorMessage("Already actioned today");
      return;
    }

    setErrorMessage("");

    try {
      const endpoint = API_CONFIG.endpoints[currentEndpointIndex];
      const response = await axios.post(`${endpoint}transaction/broadcast`, {
        userID: userID,
        status: status
      });

      alert(response.data.note);

      const updatedData = await axios.get(`${endpoint}blockchain`);
      setBlocks(updatedData.data);
      
      setUserID("");
      setCurrentEndpointIndex((currentEndpointIndex + 1) % API_CONFIG.endpoints.length);
    } catch (error) {
      setErrorMessage(error.response?.data?.message || `${status} failed`);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2 bg-emerald-800 text-white">
          <CardContent className="p-8">
            <h2 className="text-lg font-medium">Hi there!👋</h2>
            <h1 className="text-4xl font-bold mb-8">Lets go to Absensi!
            </h1>

            <div className="mb-8">
              <h1 className="text-6xl font-bold">{formattedTime}</h1>
              <p className="text-xl mt-2">{formattedDate}</p>
            </div>

            <div className="space-y-4">
              <input
                type="text"
                className="w-full p-3 bg-emerald-700/50 rounded-lg text-white placeholder-white/70"
                placeholder="Enter your User ID"
                value={userID}
                onChange={(e) => setUserID(e.target.value)}
              />
              {errorMessage && (
                <div className="text-red-300 text-sm">{errorMessage}</div>
              )}
              {miningStatus && (
                <div className="text-lime-300 text-sm">{miningStatus}</div>
              )}
              <div className="flex justify-between space-x-4">
                <button
                  onClick={() => handleTransaction("Present")}
                  className="flex-1 bg-lime-400 text-emerald-900 p-4 rounded-lg flex items-center justify-center space-x-2 font-medium hover:bg-lime-300 transition-colors"
                >
                  <span>Present</span>
                </button>
                <button
                  onClick={() => handleTransaction("Absent")}
                  className="flex-1 bg-red-400 text-emerald-900 p-4 rounded-lg flex items-center justify-center space-x-2 font-medium hover:bg-red-300 transition-colors"
                >
                  <span>Absent</span>
                </button>
                
              </div>
              <div className="flex justify-between space-x-4">
                <button
                    onClick={() => handleTransaction("Mine")}
                    className="flex-1 bg-blue-400 text-emerald-900 p-4 rounded-lg flex items-center justify-center space-x-2 font-medium hover:bg-blue-300 transition-colors"
                  >
                    <span>Mine</span>
                </button>
              </div>
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
      </div>
    </div>
  );
};

export default Dashboard;
