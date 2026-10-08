# RentTrack

RentTrack is an Expo and React Native prototype for managing vehicle rentals. This build is the administrator side only: fleet management, bookings, vehicle release and return, checkout, payments, and reports.

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

## Try the prototype

The sign-in screen is a prototype: the email and password fields are not verified, and **Sign in** opens the administrator dashboard.

Suggested path: review the dashboard, manage fleet and customer records, create a booking, record the vehicle release and return, check out the rental, then inspect the payment and report screens.

The app seeds sample vehicles, customers, and bookings in a local SQLite database. The Yamaha R15M is part of the sample fleet. Vehicle availability is based on the selected rental period.

## Demo data resets on launch

For repeatable demonstrations, the local SQLite database is rebuilt with its sample data whenever the app initializes. Changes made while testing—such as adding a vehicle, creating a profile, or recording a booking—are not retained after a fresh app launch or web page reload.

## Prototype limitations

- All records are stored locally; this prototype does not synchronize data between different devices or users.
- Sign-in does not enforce production authentication or authorization.
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
