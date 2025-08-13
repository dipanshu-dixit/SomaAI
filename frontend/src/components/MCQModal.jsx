// src/components/MCQModal.jsx
import React, { useState, useEffect } from 'react';
import {
    Modal, ModalOverlay, ModalContent, ModalHeader, ModalCloseButton,
    ModalBody, ModalFooter, Button, VStack, Radio, RadioGroup, Stack, Progress, Text, Box
} from '@chakra-ui/react';
import { motion } from 'framer-motion';

const MotionBox = motion(Box);

// Internationalization constants
const LABELS = {
    HEADER_PREFIX: 'Quick questions — ',
    DESCRIPTION: 'Answer these short questions — it helps make the result accurate.',
    BACK_BUTTON: 'Back',
    CONTINUE_BUTTON: 'Continue',
    FINISH_BUTTON: 'Finish'
};

export default function MCQModal({ isOpen, onClose, questions = [], symptom, onComplete }) {
    const [idx, setIdx] = useState(0);
    const [answers, setAnswers] = useState({});

    useEffect(() => {
        if (!isOpen) {
            setIdx(0);
            setAnswers({});
        }
    }, [isOpen]);

    useEffect(() => {
        // reset when new questions loaded
        setIdx(0);
        setAnswers({});
    }, [questions]);

    if (!isOpen || !questions.length) return null;
    const current = questions[idx];
    const progress = Math.round(((idx + 1) / Math.max(1, questions.length)) * 100);

    const setAnswer = (val) => {
        setAnswers(prev => ({ ...prev, [current.id]: val }));
    };

    const next = () => {
        if (!answers[current.id]) return;
        if (idx + 1 < questions.length) setIdx(idx + 1);
        else {
            onComplete(answers);
            onClose();
        }
    };

    const back = () => { if (idx > 0) setIdx(idx - 1); };

    return (
        <Modal isOpen={isOpen} onClose={onClose} isCentered size="lg">
            <ModalOverlay />
            <ModalContent>
                <ModalHeader>{LABELS.HEADER_PREFIX}{symptom}</ModalHeader>
                <ModalCloseButton />
                <ModalBody>
                    <VStack align="stretch">
                        <Text fontSize="sm" color="gray.600">{LABELS.DESCRIPTION}</Text>
                        <Progress value={progress} size="sm" borderRadius="md" />
                        <MotionBox initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} mt={4}>
                            <Text fontWeight="semibold" mb={3}>{current?.q}</Text>
                            <RadioGroup value={answers[current?.id] || ''} onChange={setAnswer}>
                                <Stack direction="column">
                                    {current?.options?.map((opt, index) => <Radio key={`${current.id}-${opt}`} value={opt}>{opt}</Radio>)}
                                </Stack>
                            </RadioGroup>
                        </MotionBox>
                    </VStack>
                </ModalBody>
                <ModalFooter>
                    <Button mr={3} onClick={back} variant="ghost" isDisabled={idx === 0}>{LABELS.BACK_BUTTON}</Button>
                    <Button colorScheme="blue" onClick={next} isDisabled={!answers[current?.id]}>{idx + 1 < questions.length ? LABELS.CONTINUE_BUTTON : LABELS.FINISH_BUTTON}</Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
}