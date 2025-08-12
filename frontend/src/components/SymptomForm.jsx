import React, { useState } from 'react';
import { Box, Textarea, Button } from '@chakra-ui/react';

// Internationalization constants
const LABELS = {
    PLACEHOLDER: 'Describe symptoms...',
    BUTTON_TEXT: 'Analyze'
};

export default function SymptomForm({ onAnalyze, loading }) {
    const [text, setText] = useState('');
    return (
        <Box>
            <Textarea value={text} onChange={(e) => setText(e.target.value)} placeholder={LABELS.PLACEHOLDER} minH="120px" />
            <Button mt={3} colorScheme="brand" onClick={() => onAnalyze(text)} isLoading={loading}>{LABELS.BUTTON_TEXT}</Button>
        </Box>
    );
}
