'use client';

import { useState } from 'react';
import { Button, Input, FormControl, FormLabel, Textarea, Box, Heading, Stack, HStack, useToast, Text } from '@chakra-ui/react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { FiMail, FiTrash2, FiSearch } from 'react-icons/fi';

export default function HotelEmails() {
    const [hotelEmails, setHotelEmails] = useState<string[]>([]);
    const [hotelQuery, setHotelQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [startDate, setStartDate] = useState<Date | undefined>(undefined);
    const [endDate, setEndDate] = useState<Date | undefined>(undefined);
    const [guestCount, setGuestCount] = useState<number>(2); // Default to 2 guests
    const [extraWishes, setExtraWishes] = useState<string>('Is it possible to get a room with a balcony?');
    const toast = useToast();

    const handleSearchEmail = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!hotelQuery) return;

        setIsSearching(true);
        try {
            // First check if it's already an email
            if (hotelQuery.includes('@') && hotelQuery.includes('.')) {
                if (!hotelEmails.includes(hotelQuery)) {
                    setHotelEmails([...hotelEmails, hotelQuery]);
                }
                setHotelQuery('');
                setIsSearching(false);
                return;
            }

            // Otherwise, search for it
            const response = await fetch('/api/find-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query: hotelQuery })
            });

            const data = await response.json();

            if (data.emails && data.emails.length > 0) {
                const firstEmail = data.emails[0];
                if (!hotelEmails.includes(firstEmail)) {
                    setHotelEmails([...hotelEmails, firstEmail]);
                    toast({
                        title: 'Email found!',
                        description: `Added ${firstEmail}`,
                        status: 'success',
                        duration: 3000,
                        isClosable: true,
                    });
                }
                setHotelQuery('');
            } else {
                toast({
                    title: 'No email found',
                    description: 'Could not find an email for this hotel. Please enter it manually.',
                    status: 'warning',
                    duration: 5000,
                    isClosable: true,
                });
            }
        } catch {
            toast({
                title: 'Error',
                description: 'Failed to search for email.',
                status: 'error',
                duration: 3000,
                isClosable: true,
            });
        } finally {
            setIsSearching(false);
        }
    };

    const handleRemoveEmail = (emailToRemove: string) => {
        setHotelEmails(hotelEmails.filter((e) => e !== emailToRemove));
    };

    const handleSendRequest = () => {
        if (hotelEmails.length === 0) {
            toast({
                title: 'No recipients',
                description: 'Please add at least one hotel email.',
                status: 'warning',
                duration: 3000,
                isClosable: true,
            });
            return;
        }

        if (!startDate || !endDate) {
            toast({
                title: 'Dates required',
                description: 'Please select check-in and check-out dates.',
                status: 'warning',
                duration: 3000,
                isClosable: true,
            });
            return;
        }

        const bccList = hotelEmails.join(',');
        const checkInStr = startDate.toLocaleDateString();
        const checkOutStr = endDate.toLocaleDateString();
        const nights = Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

        const subject = encodeURIComponent(`Booking Inquiry: ${checkInStr} to ${checkOutStr} - ${nights} Nights`);

        const bodyText = `Dear Hotel Team,

I am writing to inquire about the best available rate for a stay at your property.

Details:
- Check-in: ${checkInStr}
- Check-out: ${checkOutStr}
- Number of guests: ${guestCount}

${extraWishes ? `Special requests:\n${extraWishes}\n` : ''}
Could you please provide me with your best price for this stay? We are flexible and looking for a good deal.

Looking forward to your response.

Best regards,`;

        const body = encodeURIComponent(bodyText);

        // Open default email client with BCC so hotels don't see each other
        window.location.href = `mailto:?bcc=${bccList}&subject=${subject}&body=${body}`;

        toast({
            title: 'Email client opened',
            description: 'Your default email app should open with the prepared message.',
            status: 'info',
            duration: 5000,
            isClosable: true,
        });
    };

    return (
        <Box maxWidth="600px" mx="auto" p={6} borderWidth={1} borderRadius="xl" boxShadow="xl" bg="white" color="gray.800">
            <Heading as="h2" size="xl" mb={6} textAlign="center" color="teal.600">
                Hotel Deal Finder
            </Heading>

            <Text mb={6} textAlign="center" color="gray.600">
                Enter a hotel name, website link, or email to find contact info and ask for better rates.
            </Text>

            <form onSubmit={handleSearchEmail}>
                <Stack spacing={5}>
                    <FormControl>
                        <FormLabel fontWeight="bold">Hotel Name, Link or Email</FormLabel>
                        <HStack>
                            <Input
                                type="text"
                                value={hotelQuery}
                                onChange={(e) => setHotelQuery(e.target.value)}
                                placeholder="e.g. Hilton Paris Opera"
                                required
                                bg="gray.50"
                                borderRadius="md"
                            />
                            <Button
                                type="submit"
                                colorScheme="teal"
                                px={6}
                                isLoading={isSearching}
                                leftIcon={<FiSearch />}
                            >
                                Find & Add
                            </Button>
                        </HStack>
                    </FormControl>

                    {hotelEmails.length > 0 && (
                        <Box bg="teal.50" p={4} borderRadius="md" borderWidth={1} borderColor="teal.100">
                            <Heading as="h3" size="sm" mb={3} color="teal.800">Recipients ({hotelEmails.length}):</Heading>
                            <Stack spacing={2}>
                                {hotelEmails.map((hotelEmail) => (
                                    <HStack key={hotelEmail} justify="space-between" bg="white" p={2} borderRadius="sm" borderWidth={1}>
                                        <HStack>
                                            <FiMail color="gray" />
                                            <Text fontSize="sm" isTruncated maxWidth="250px" title={hotelEmail}>{hotelEmail}</Text>
                                        </HStack>
                                        <Button size="xs" variant="ghost" colorScheme="red" onClick={() => handleRemoveEmail(hotelEmail)}>
                                            <FiTrash2 />
                                        </Button>
                                    </HStack>
                                ))}
                            </Stack>
                        </Box>
                    )}

                    <FormControl>
                        <FormLabel fontWeight="bold">Stay Dates</FormLabel>
                        <Stack direction={['column', 'row']} spacing={4}>
                            <Box flex={1} className="w-full">
                                <DatePicker
                                    selected={startDate}
                                    onChange={(date) => {
                                        setStartDate(date || undefined);
                                        if (endDate && date && date > endDate) {
                                            setEndDate(undefined);
                                        }
                                    }}
                                    selectsStart
                                    startDate={startDate}
                                    endDate={endDate}
                                    placeholderText="Check-in Date"
                                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 bg-gray-50"
                                    dateFormat="MMM d, yyyy"
                                />
                            </Box>
                            <Box flex={1} className="w-full">
                                <DatePicker
                                    selected={endDate}
                                    onChange={(date) => setEndDate(date || undefined)}
                                    selectsEnd
                                    startDate={startDate}
                                    endDate={endDate}
                                    minDate={startDate}
                                    placeholderText="Check-out Date"
                                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 bg-gray-50"
                                    dateFormat="MMM d, yyyy"
                                />
                            </Box>
                        </Stack>
                    </FormControl>

                    <FormControl>
                        <FormLabel fontWeight="bold">Number of Guests</FormLabel>
                        <Input
                            type="number"
                            value={guestCount}
                            onChange={(e) => setGuestCount(Number(e.target.value))}
                            min={1}
                            bg="gray.50"
                        />
                    </FormControl>

                    <FormControl>
                        <FormLabel fontWeight="bold">Special Wishes</FormLabel>
                        <Textarea
                            value={extraWishes}
                            onChange={(e) => setExtraWishes(e.target.value)}
                            placeholder="e.g. Balcony, high floor, quiet room..."
                            bg="gray.50"
                            rows={3}
                        />
                    </FormControl>

                    <Button
                        colorScheme="teal"
                        size="lg"
                        onClick={handleSendRequest}
                        width="full"
                        mt={4}
                        shadow="md"
                        _hover={{ shadow: 'lg', transform: 'translateY(-2px)' }}
                        transition="all 0.2s"
                    >
                        Compose Email to {hotelEmails.length} Hotel{hotelEmails.length !== 1 ? 's' : ''}
                    </Button>
                </Stack>
            </form>
        </Box>
    );
}
