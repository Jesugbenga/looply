import { createSlice } from '@reduxjs/toolkit'

// Initial state for the navigation slice
// Provides default values for origin, destination, and travel time information
// Pushes information tno the data layer 
const initialState = {
  origin: null,
  destination: null,
  travelTimeInformation: null,
}

export const navSlice = createSlice({
  name: 'nav',
  initialState,
  reducers: {
      setOrigin: (state, action) => {
            state.origin = action.payload;
        },
        setDestination: (state, action) => {
            state.destination = action.payload;
        },
        setTravelTimeInformation: (state, action) => {
            state.travelTimeInformation = action.payload;
        },
  },
});

export const { setOrigin, setDestination, setTravelTimeInformation } = navSlice.actions;

// Selector to get the origin from the state
// Use a local NavState type to avoid circular import with the centralized store
export type NavState = typeof initialState;

export const selectOrigin = (state: { nav: NavState }) => state.nav.origin;
// Selector to get the destination from the state
export const selectDestination = (state: { nav: NavState }) => state.nav.destination;
// Selector to get the travel time information from the state
export const selectTravelTimeInformation = (state: { nav: NavState }) => state.nav.travelTimeInformation;

export default navSlice.reducer;