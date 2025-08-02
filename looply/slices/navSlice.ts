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
interface RootState {
  nav: typeof initialState;
}
 
export const selectOrigin = (state: RootState) => state.nav.origin;
// Selector to get the destination from the state
export const selectDestination = (state: RootState) => state.nav.destination;
// Selector to get the travel time information from the state
export const selectTravelTimeInformation = (state: RootState) => state.nav.travelTimeInformation;

export default navSlice.reducer;