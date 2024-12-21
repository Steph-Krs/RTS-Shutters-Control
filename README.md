# RTS-Shutters-Control

This guide provides instructions for installing **RTS-Shutters-Control**, a tool to control Somfy shutters. The system allows:  
- Controlling shutters individually or in groups.  
- Executing commands immediately or scheduling actions based on time or solar events.  
- Accessing the system remotely via port redirection.  

---

## Requirements  

1. **Hardware**:  
   - An Arduino with a 433.42 MHz RF transmitter connected to `ttyUSB0` on your server.  
     - Based on this project: [Romain Piquard's Guide](https://www.romainpiquard.fr/article-133-controler-ses-volets-somfy-avec-un-arduino.php)  
     - Original GitHub Repository: [Somfy_Remote by Nickduino](https://github.com/Nickduino/Somfy_Remote)  

2. **Software**:  
   - Android App for controlling shutters (*working but not released yet*).  
   - HTML Webpage for controlling shutters (*working but not released yet*).  

---

## Prerequisites  

Update your system and install required tools:  

```bash
sudo apt-get update -y
sudo apt-get upgrade -y
sudo apt-get install -y unzip npm
```

---

## Installing RTS-Shutters-Control  

Follow these steps to install and configure the software:  

1. Download the latest version of the project:  
```bash
   wget -O RTS-Shutters-Control.zip https://github.com/Steph-Krs/RTS-Shutters-Control/archive/refs/heads/main.zip
```

2. Extract the downloaded archive (use the -o flag to overwrite existing files if necessary):  
```bash
   unzip -o RTS-Shutters-Control.zip
```
   
3. Install the Debian package:
```bash
   sudo dpkg -i RTS-Shutters-Control-main/install/RTS-Shutters-Control.deb
```
