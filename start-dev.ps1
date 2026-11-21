# Kumari Parking — Local Full-Stack Dev Launcher (Windows PowerShell)
$env:PYTHONPATH = "$PSScriptRoot\backend;$PSScriptRoot\backend\.pylibs"
Start-Process -NoNewWindow -FilePath "C:\Users\anto wilpet\AppData\Local\Programs\Python\Python38\python.exe" -ArgumentList "-m", "uvicorn", "app.main:app", "--host", "127.0.0.1", "--port", "8000", "--app-dir", "$PSScriptRoot\backend"
npm --prefix "$PSScriptRoot\frontend" run dev
