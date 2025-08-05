/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all files that contain Nativewind classes.
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: '#37B6E9',
        'primary-dark': '#3D9CEA',
        secondary: '#4B4CED',
        'gradient-from': '#353F54',
        'gradient-to': '#222834',
        surface: '#242C3B',
        'surface-light': '#323B4F',
        'text-main': '#fff',
        'text-muted': '#B0B8C1',
      },
      fontFamily: {
        poppins: ['Poppins-Regular', 'Poppins', 'sans-serif'],
        'poppins-semibold': ['Poppins-SemiBold', 'Poppins', 'sans-serif'],
        'poppins-bold': ['Poppins-Bold', 'Poppins', 'sans-serif'],
        inter: ['Inter-Regular', 'Inter', 'sans-serif'],
        'inter-semibold': ['Inter-SemiBold', 'Inter', 'sans-serif'],
        'inter-bold': ['Inter-Bold', 'Inter', 'sans-serif'],
      },
       gradientColorStops: theme => ({
        ...theme('colors'),
      }),
    },
  },
  plugins: [],
}
