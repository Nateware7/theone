/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./views/**/*.ejs", "./public/**/*.html"],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: '#27ae60',
          warning: '#fff3cd'
        },
        customDark: 'rgba(25, 23, 22, 0.98)', // Adjust opacity (250 is invalid, replaced with 0.98)
      },
      fontFamily: {
        poppins: ['Poppins', 'serif'], // Add Poppins to the font-family
      },
    },
  },
  plugins: [],
}

