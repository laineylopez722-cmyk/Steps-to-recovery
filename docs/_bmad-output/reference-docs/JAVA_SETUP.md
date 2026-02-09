# Java JDK Setup Guide

## Problem
JDK 17 or higher is required for Android builds. Java is not currently installed or configured.

## Solution

### Option 1: Install JDK via Android Studio (Recommended)
1. Download and install [Android Studio](https://developer.android.com/studio)
2. Android Studio includes JDK 17+ automatically
3. After installation, JDK will be located at:
   - `C:\Program Files\Android\Android Studio\jbr` (or similar)

### Option 2: Install JDK Manually
1. Download JDK 17 or higher from:
   - [Oracle JDK](https://www.oracle.com/java/technologies/downloads/#java17)
   - [OpenJDK (Adoptium/Temurin)](https://adoptium.net/) (Recommended - free)
2. Install to a location like: `C:\Program Files\Java\jdk-17` (or jdk-21, etc.)

### Setting JAVA_HOME Environment Variable

#### Windows PowerShell (Current Session):
```powershell
$env:JAVA_HOME = "C:\Program Files\Java\jdk-17"
$env:PATH = "$env:JAVA_HOME\bin;$env:PATH"
```

#### Windows (Permanent - System-wide):
1. Open "Edit the system environment variables" (search in Start menu)
2. Click "Environment Variables"
3. Under "System variables", click "New"
4. Variable name: `JAVA_HOME`
5. Variable value: `C:\Program Files\Java\jdk-17` (or your JDK path)
6. Click OK
7. Edit the `Path` variable and add: `%JAVA_HOME%\bin`
8. Click OK on all dialogs
9. Restart your terminal/IDE

#### Windows (Permanent - User-specific):
```powershell
[System.Environment]::SetEnvironmentVariable('JAVA_HOME', 'C:\Program Files\Java\jdk-17', 'User')
$currentPath = [System.Environment]::GetEnvironmentVariable('Path', 'User')
[System.Environment]::SetEnvironmentVariable('Path', "$currentPath;$env:JAVA_HOME\bin", 'User')
```

### Verify Installation
After setting JAVA_HOME, verify it works:
```powershell
java -version
echo $env:JAVA_HOME
```

### For Android Builds
Once Java is installed, you can also create `android/local.properties` with:
```
sdk.dir=C\:\\Users\\YourUsername\\AppData\\Local\\Android\\Sdk
```

## Quick Fix for VS Code / Cursor
If you're using VS Code or Cursor, you can also set the Java path in settings:
1. Open Settings (Ctrl+,)
2. Search for: `java.jdt.ls.java.home`
3. Set it to your JDK path (e.g., `C:\Program Files\Java\jdk-17`)

