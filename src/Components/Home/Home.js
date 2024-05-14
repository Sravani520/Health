import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './Home.css';

const Home = () => {
  const [sensorData, setSensorData] = useState(null);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [showMessage, setShowMessage] = useState(false);
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (!localStorage.getItem('token')) {
      navigate('/');
    }
  }, [navigate]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get('http://127.0.0.1:5000/sensor-data');
        const data = response.data.result;
        setSensorData(data);

        let alertMessage = '';
        if (data.result === 'Level:1 - MODERATE ') {
          alertMessage = 'SMS alert sent to number: 6302667331';
          sendSMSAlert(data, alertMessage);
        } else if (data.result === 'Level:2 - IMMEDIATE ACTION REQUIRED') {
          alertMessage = 'SMS alert sent with Location to number: 6302667331';
          sendSMSAlert(data, alertMessage, true);
        } else {
          setShowAlert(false);
          setAlertMessage('');
        }

        if (data.result === 'Place Your Finger Properly!!!') {
          setSensorData(null); // Empty sensor data
          setShowMessage(true);
          setMessage('Place Your Finger Properly!!!');
        } else {
          setShowMessage(false);
          setMessage('');
        }
        const sendSMSAlert = async (data, alertMessage, includeLocation = false) => {
          let message = `Alert: Abnormal Sensor values found:
          HB:${data.h} SPO2:${data.s} T:${data.t} F:${data.f}`;
      
          if (includeLocation) {
            const location = '16°30\'30.6"N 80°39\'10.8"E'; // Example location; replace with actual data if available
            message += ` LOCATION: ${location}`;
          }
      
          try {
            await axios.post('http://localhost:3001/send-alert', {
            phoneNumber: '+916302667331',
            hb: data.h,
            spo2: data.s,
            temperature: data.t,
            location: includeLocation ? location : null
            });
            setShowAlert(true);
            setAlertMessage(alertMessage);
          } catch (error) {
            console.error('Error sending SMS:', error);
          }
        };
      
      } catch (error) {
        console.error('Error fetching sensor data:', error);
        setShowMessage(true);
        setMessage('Ensure you connect the kit properly or there might be some error in reading the data.');
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 20000);

    return () => clearInterval(interval);
  }, []);

  
  useEffect(() => {
    const postData = async () => {
      try {
        await axios.post('https://healthguard-backend-sensordatasave.onrender.com/sensor-data', {
          temperature: sensorData.t,
          heartbeat: sensorData.h,
          spo2: sensorData.s,
          fallDetected: sensorData.f,
          severityLevel: sensorData.result,
        });
      } catch (error) {
        console.error('Error posting sensor data:', error);
      }
    };

    if (sensorData) {
      postData();
    }
  }, [sensorData]);

  return (
    <div className='home-container'>
      <div className='heading'>
        <h2>WELCOME TO HEALTHGUARD!!!</h2><br /> <br />
      </div>
      <div className='home'>
        {showAlert && (
          <div className='alert'>
            <p className='alert-message'>{alertMessage}</p>
          </div>
        )}
        {showMessage ? (
          <div className='message'>
            <p>{message}</p>
          </div>
        ) : (
          !showMessage && sensorData && (
            <div className='Content'>
              <p className='data'>Temperature: {sensorData.t}</p>
              <p className='data'>Heartbeat: {sensorData.h}</p>
              <p className='data'>SPo2: {sensorData.s}</p>
              <p className='data'>Fall Detected: {sensorData.f}</p>
              <p className='data'>Severity Level: {sensorData.result}</p>
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default Home;
