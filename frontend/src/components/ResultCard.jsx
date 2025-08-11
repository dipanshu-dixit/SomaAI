import React from 'react';
import { Box, Heading, Text, VStack, Badge, List, ListItem, HStack } from '@chakra-ui/react';
import { motion } from 'framer-motion';

const MotionBox = motion(Box);

const URGENCY = { low: 'green', medium: 'orange', high: 'red' };

export default function ResultCard({ result }) {
    if (!result) return null;

    return (
        <MotionBox bg="white" color="black" p={6} rounded="lg" shadow="lg" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <VStack align="start" spacing={4}>
                <HStack justify="space-between" w="100%">
                    <Heading size="md">Summary</Heading>
                    <Badge colorScheme={URGENCY[(result.urgency || 'low')] || 'gray'}>{(result.urgency || 'low').toUpperCase()}</Badge>
                </HStack>

                <Text>{result.summary}</Text>

                <Box bg="gray.50" p={3} rounded="md" w="100%">
                    <Text fontWeight="600">Friendly note</Text>
                    <Text>{result.friendly}</Text>
                    {result.cosmic && <Text mt={2} fontStyle="italic" color="gray.600">✨ A little cosmic insight included</Text>}
                </Box>

                <Heading size="sm">Possible causes</Heading>
                <List spacing={2}>
                    {result.possible_causes && result.possible_causes.length ? result.possible_causes.map((c, i) => <ListItem key={i}>• {c}</ListItem>) : <ListItem>• Not enough info</ListItem>}
                </List>

                <Heading size="sm">Next steps</Heading>
                <List spacing={2}>
                    {result.next_steps && result.next_steps.length ? result.next_steps.map((s, i) => <ListItem key={i}>• {s}</ListItem>) : <ListItem>• No steps suggested</ListItem>}
                </List>

                {result.grounding && result.grounding.length > 0 && (
                    <>
                        <Heading size="sm">Grounding exercise</Heading>
                        <List spacing={2}>
                            {result.grounding.map((g, i) => <ListItem key={i}>• {g}</ListItem>)}
                        </List>
                    </>
                )}
            </VStack>
        </MotionBox>
    );
}
