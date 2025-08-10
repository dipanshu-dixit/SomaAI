// frontend/src/components/ResultCard.jsx
import { Box, Heading, Text, List, ListItem, Badge, Stack } from "@chakra-ui/react";

const urgencyColors = {
    low: "green",
    medium: "yellow",
    high: "red",
};

export default function ResultCard({ result }) {
    if (!result) return null;

    return (
        <Box
            borderWidth="1px"
            borderRadius="lg"
            p={5}
            shadow="md"
            bg="white"
            maxW="600px"
            mx="auto"
        >
            <Heading size="md" mb={3}>
                Summary
            </Heading>
            <Text mb={4}>{result.summary}</Text>

            <Heading size="md" mb={2}>
                Possible Causes
            </Heading>
            <List spacing={1} mb={4}>
                {result.possible_causes?.map((cause, idx) => (
                    <ListItem key={idx}>• {cause}</ListItem>
                ))}
            </List>

            <Stack direction="row" align="center" mb={4}>
                <Heading size="sm">Urgency:</Heading>
                <Badge colorScheme={urgencyColors[result.urgency] || "gray"}>
                    {result.urgency}
                </Badge>
            </Stack>

            <Heading size="md" mb={2}>
                Next Steps
            </Heading>
            <List spacing={1}>
                {result.next_steps?.map((step, idx) => (
                    <ListItem key={idx}>• {step}</ListItem>
                ))}
            </List>
        </Box>
    );
}