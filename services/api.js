const API_URL = "http://localhost:3000/api";

export async function getVehicles() {
  const response = await fetch(
    `${API_URL}/vehicles`
  );

  return response.json();
}

export async function getBookings() {
  const response = await fetch(
    `${API_URL}/bookings`
  );

  return response.json();
}

export async function getCustomers() {
  const response = await fetch(
    `${API_URL}/customers`
  );

  return response.json();
}