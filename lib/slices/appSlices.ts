import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export interface AppState {
  sort: string
  search: string
  page: number
}

const initialState: AppState = {
  sort: '',
  search: '',
  page: 1,
}

export const appSlice = createSlice({
  name: 'app',
  initialState,
  reducers: {
    setSort: (state, action: PayloadAction<string>) => {
      state.sort = action.payload
    },
    setSearch: (state, action: PayloadAction<string>) => {
      state.search = action.payload
      state.page = 1 // Resetea a la primera página al realizar una nueva búsqueda
    },
    setPage: (state, action: PayloadAction<number>) => {
      state.page = action.payload
    },
    resetFilters: (state) => {
      state.sort = ''
      state.search = ''
      state.page = 1
    },
  },
})

export const { setSort, setSearch, setPage, resetFilters } = appSlice.actions

export default appSlice.reducer