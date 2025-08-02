import { BookingItem } from "./datatypes";


const baseUrl = "http://localhost:5127";

// Booking Status Api
export const BookingStatusApi = async ({ currentView }: { currentView: string }) => {
  try {
    const response = await fetch(
      `${baseUrl}/api/AdminBooking?status=${currentView}`
    );

    if (!response.ok) {
      const errorText = await response.text(); // Get more readable server message
      throw new Error(`HTTP error! Status: ${response.status} - ${errorText}`);
    }

    const BookingItems: BookingItem[] = await response.json();
    return BookingItems;
  } catch (error: any) {
    alert("Can't load the slots, please try again later.");
  }
};

//Only url is provided for the dashbord

export const DashbordGraphYear = ({year}: {year: number}) =>
{
    return `${baseUrl}/api/AdminDashboard/year?year=${year}`;
}

export const DashbordGraphMonth = ({month, year}: {month: number; year: number}) => {
    return `${baseUrl}/api/AdminDashboard/month?month=${month}&year=${year}`;
}

// Dashbord Summary
export const DashboardSummary = async() => {
    try{
        const result = await fetch(`${baseUrl}/api/AdminDashboard/summary`);
        return result.json();
    }
    catch(err)
    {
        alert("An unexpected error has been occured when taking the summary")
    }
}
