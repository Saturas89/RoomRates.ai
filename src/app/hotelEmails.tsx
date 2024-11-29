'use client';

import { useState } from 'react';
import { Button, Input, FormControl, FormLabel, Textarea, Box, Heading, Stack, HStack } from '@chakra-ui/react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

export default function HotelEmails() {
    const [hotelEmails, setHotelEmails] = useState<string[]>([]);
    const [email, setEmail] = useState('');
    const [startDate, setStartDate] = useState<Date | undefined>(undefined);
    const [endDate, setEndDate] = useState<Date | undefined>(undefined);
    const [guestCount, setGuestCount] = useState<number>(1); // Default to 1 guest
    const [extraWishes, setExtraWishes] = useState<string>('');

    const handleAddEmail = (e: React.FormEvent) => {
        e.preventDefault();
        if (email && !hotelEmails.includes(email)) {
            setHotelEmails([...hotelEmails, email]);
            setEmail(''); // Clear input after adding
        }
    };

    const handleRemoveEmail = (emailToRemove: string) => {
        setHotelEmails(hotelEmails.filter((e) => e !== emailToRemove));
    };

    const handleSendRequest = () => {
        // Logic to send the request can be implemented here
        console.log("Sending request with the following details:");
        console.log("Emails:", hotelEmails);
        console.log("Stay Dates:", startDate, endDate);
        console.log("Guest Count:", guestCount);
        console.log("Extra Wishes:", extraWishes);
    };

    return (
        <Box maxWidth="600px" mx="auto" p={5} borderWidth={1} borderRadius="lg" boxShadow="md">
            <Heading as="h2" size="lg" mb={4} textAlign="center">Hotel Booking Form</Heading>
            <form onSubmit={handleAddEmail}>
                <Stack spacing={4}>
                    <FormControl>
                        <FormLabel>Enter Hotel Email</FormLabel>
                        <HStack>
                            <Input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="Enter hotel email"
                                required
                            />
                            <Button type="submit" colorScheme="teal" size="sm">
                                Add
                            </Button>
                        </HStack>
                    </FormControl>

                    <FormControl>
                        <FormLabel>Select Stay Dates</FormLabel>
                        <Stack direction={['column', 'row']} spacing={4}>
                            <DatePicker
                                selected={startDate}
                                onChange={(date) => {
                                    setStartDate(date);
                                    if (endDate && date && date > endDate) {
                                        setEndDate(null); // Reset end date if start date is after it
                                    }
                                }}
                                selectsStart
                                startDate={startDate}
                                endDate={endDate}
                                placeholderText="Check-in"
                                className="border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <DatePicker
                                selected={endDate}
                                onChange={(date) => setEndDate(date)}
                                selectsEnd
                                startDate={startDate}
                                endDate={endDate}
                                minDate={startDate} // Prevent selecting an end date before start date
                                placeholderText="Check-out"
                                className="border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </Stack>
                    </FormControl>

                    <FormControl>
                        <FormLabel>Number of Guests</FormLabel>
                        <Input
                            type="number"
                            value={guestCount}
                            onChange={(e) => setGuestCount(Number(e.target.value))}
                            min={1} // Minimum of 1 guest
                        />
                    </FormControl>

                    <FormControl>
                        <FormLabel>Extra Wishes</FormLabel>
                        <Textarea
                            value={extraWishes}
                            onChange={(e) => setExtraWishes(e.target.value)}
                            placeholder="Any special requests or wishes?"
                        />
                    </FormControl>

                    {/* Send Request Button */}
                    <Button colorScheme="blue" onClick={handleSendRequest} width="full">
                        Send Request
                    </Button>
                </Stack>
            </form>

            {/* Displaying the list of hotel emails */}
            <Box mt={6}>
                <Heading as="h3" size="md" mb={2}>Added Hotel Emails:</Heading>
                <ul className="list-disc pl-5">
                    {hotelEmails.map((hotelEmail) => (
                        <li key={hotelEmail} className="flex justify-between items-center">
                            {hotelEmail}
                            <Button variant="link" colorScheme="red" onClick={() => handleRemoveEmail(hotelEmail)}>
                                Remove
                            </Button>
                        </li>
                    ))}
                </ul>
            </Box>
        </Box>
    );
}
