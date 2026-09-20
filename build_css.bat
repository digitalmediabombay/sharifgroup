@echo off
echo ===================================================
echo Sharif Group - Compiling Production Tailwind CSS...
echo ===================================================

if exist tailwindcss.exe (
    tailwindcss.exe -i assets/css/tailwind-input.css -o assets/css/tailwind.min.css --minify
) else (
    npx tailwindcss -i assets/css/tailwind-input.css -o assets/css/tailwind.min.css --minify
)

echo Done! Production CSS generated at assets/css/tailwind.min.css
pause
