# Dulce Bethel OS - Migración React Native

¡La estructura base de tu nueva App Android está lista!

### Pasos obligatorios para que funcione:

1.  **Configura Supabase**:
    *   Ve a tu panel de Supabase y abre el **SQL Editor**.
    *   Crea una nueva consulta y pega el contenido de [supabase_schema.sql](./supabase_schema.sql). Dale a **Run**.
2.  **Configura las credenciales**:
    *   Abre el archivo [app/.env](./app/.env).
    *   Pega tu **URL de Proyecto** y **Anon Key** de Supabase.
3.  **Ejecuta la App**:
    *   Abre una terminal en la carpeta `app`.
    *   Ejecuta: `npx expo start`
    *   Presiona `a` para abrir en un emulador de Android o descarga la app **Expo Go** en tu teléfono y escanea el código QR.

### Características implementadas:
*   **Base de Datos**: Esquema relacional completo con funciones de stock automáticas.
*   **Navegación**: Sistema de 6 pestañas (Caja, Inventario, Rutas, Deudas, Clientes, Finanzas).
*   **Estado Global**: Manejo de carrito y tasa BCV con Zustand.
*   **Estilos**: Tailwind CSS (NativeWind) configurado con tus colores corporativos.
*   **CI/CD**: Workflow de GitHub Actions listo para compilar APKs.

### Siguientes pasos:
Estoy terminando de pulir la lógica de la pantalla de **Caja (POS)** para que puedas hacer ventas reales con animaciones fluidas.
