@echo off
cd /d "C:\Users\Asus\Desktop\AUTO-PEDIDO\P3DIDOSAUTO"

echo Agregando cambios...
git add .

if %errorlevel% neq 0 (
    echo Error al agregar cambios. Verifica que Git esté instalado y que estés en la carpeta correcta.
    pause
    exit /b %errorlevel%
)

echo Haciendo commit...
git commit -m "Elimina posibles referencias a .slice() que causaban errores"

if %errorlevel% neq 0 (
    echo No hay cambios para hacer commit o hubo un error.
    pause
    exit /b %errorlevel%
)

echo Haciendo push...
git push

if %errorlevel% neq 0 (
    echo Error al hacer push. Verifica tu conexión y permisos.
    pause
    exit /b %errorlevel%
)

echo Commit y push completados exitosamente!
pause