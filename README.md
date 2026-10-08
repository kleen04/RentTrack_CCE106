# RentTrack

RentTrack is an Expo and React Native application for managing vehicle rentals. This build is the administrator side only: fleet management, bookings, vehicle release and return, checkout, payments, and reports.

## Requirements

- Node.js LTS and npm
- Git
- For device testing: Expo Go installed on an iOS or Android device
- For Android emulator testing: Android Studio and an Android emulator
- For iOS simulator testing: macOS with Xcode

The project uses Expo SDK 57. It does not require checked-in `ios/` or `android/` directories to run in Expo Go.

## Set up

1. Clone this repository from GitHub, then open a terminal in the project directory.
2. Install the dependencies:

   ```sh
   npm ci
   ```

3. Start the Expo development server:

   ```sh
   npx expo start
   ```

4. Open the app:
   - **Physical Android or iOS device:** scan the QR code in the terminal or Expo Dev Tools using Expo Go. The computer and phone should be on the same network.
   - **Android emulator:** press `a` in the Expo terminal, or run `npm run android`.
   - **iOS simulator:** press `i` on macOS, or run `npm run ios`.
   - **Web browser:** press `w`, or run `npm run web`.

If PowerShell blocks the `npx` script on Windows, use the command wrapper:

```powershell
npx.cmd expo start
```

If a device cannot connect over the local network, select **Tunnel** from the Expo Dev Tools connection options.

## Getting started

Create an administrator account from the sign-in screen, then use its email and password to sign in. Passwords are stored as salted SHA-256 hashes in the local SQLite database. The login session is held in memory and ends when the app restarts or you log out. Forgot-password requests must be handled by the system owner.

Suggested path: review the dashboard, manage fleet and customer records, create a booking, record the vehicle release and return, check out the rental, then inspect the payment and report screens. Customer forms validate Philippine mobile numbers, optional email addresses, and duplicate name/phone pairs. Vehicle forms validate unique plates in the ABC 1234 format and positive daily rates. Booking forms require a positive one-way distance. Reserved bookings can have their dates and destination changed, and active rentals can be extended if the vehicle is still available for the full period. Changes recalculate the quote; amounts already paid are credited toward the new total. Completed and cancelled bookings cannot be edited. Customer and vehicle profiles can be edited; customers can be archived only when they have no active or reserved bookings. Editing a vehicle's daily rate affects new bookings only; existing booking totals are retained.

The app starts with an empty local SQLite database, and records persist across app launches. To load the sample vehicles, customers, and bookings (including the Yamaha R15M), use **Restore sample records** at the bottom of the dashboard and confirm. This replaces all saved vehicles, customers, bookings, and payments with the sample records. Vehicle availability is based on the selected rental period.

## System limitations

- All records are stored locally; the application does not synchronize data between different devices or users.
- Authentication is local to this device and is not a production identity or account-recovery system. The requested salted SHA-256 password hashing is fast and is not suitable for production credential storage; use a server-side password-hashing scheme designed to resist brute-force attacks for a deployed service.
- Checkout records a simulated payment only. No real payment is processed.
- Report export is a preview; it does not create or save a PDF.

## Useful commands

```sh
npm run lint       # Run Expo lint
npx expo start     # Start the development server
npx expo start --web
```

## Project structure

- `app/` — Expo Router screens and navigation
- `components/` — reusable interface components
- `constants/` — shared constants and bundled image mappings
- `data/` — sample fleet, customer, and transaction data
- `services/` — SQLite operations, pricing, and platform-specific helpers
- `assets/` — app branding and vehicle images
