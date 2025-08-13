import { extendTheme } from '@chakra-ui/react';

const theme = extendTheme({
    config: { 
        initialColorMode: 'light', 
        useSystemColorMode: false 
    },
    styles: {
        global: {
            body: {
                bg: 'linear-gradient(180deg, #f7fbff 0%, #eef6ff 100%)',
                color: '#0f1724',
                fontFamily: 'Inter, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial',
            }
        }
    },
    colors: {
        brand: {
            50: '#f5f7ff',
            100: '#e6e9ff',
            200: '#cbd0ff',
            300: '#a8b0ff',
            400: '#7c8cff',
            500: '#5a62ff',
            600: '#3f3fe6',
            700: '#2f2fb4',
            800: '#1f1f82',
            900: '#0f0f51'
        }
    },
    fonts: { 
        heading: 'Inter, system-ui, sans-serif', 
        body: 'Inter, system-ui, sans-serif' 
    }
});

export default theme;