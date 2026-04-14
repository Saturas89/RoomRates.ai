'use client';

import { useState } from 'react';
import { Button, Input, FormControl, FormLabel, Textarea, Box, Heading, Stack, HStack, useToast, Text, Checkbox } from '@chakra-ui/react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { FiMail, FiTrash2, FiSearch } from 'react-icons/fi';

import { Modal, ModalOverlay, ModalContent, ModalHeader, ModalFooter, ModalBody, ModalCloseButton, useDisclosure } from '@chakra-ui/react';

export interface HotelData {
    id: string;
    name: string;
    price: string;
    review: string;
}

export default function HotelEmails() {
    const [hotelEmails, setHotelEmails] = useState<string[]>([]);
    const [hotelQuery, setHotelQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const { isOpen, onOpen, onClose } = useDisclosure();
    const [bookingUrl, setBookingUrl] = useState('');
    const [htmlContent, setHtmlContent] = useState('');
    const [isScraping, setIsScraping] = useState(false);

    // Extracted Hotels State
    const [fetchedHotels, setFetchedHotels] = useState<HotelData[]>([]);
    const [selectedHotels, setSelectedHotels] = useState<Set<string>>(new Set());

    const [startDate, setStartDate] = useState<Date | undefined>(undefined);
    const [endDate, setEndDate] = useState<Date | undefined>(undefined);
    const [guestCount, setGuestCount] = useState<number>(2); // Default to 2 guests
    const [extraWishes, setExtraWishes] = useState<string>('Is it possible to get a room with a balcony?');
    const toast = useToast();

    const handleToggleHotelSelection = (hotelId: string) => {
        const newSelected = new Set(selectedHotels);
        if (newSelected.has(hotelId)) {
            newSelected.delete(hotelId);
        } else {
            newSelected.add(hotelId);
        }
        setSelectedHotels(newSelected);
    };

    const handleProcessSelectedHotels = async () => {
        const selected = fetchedHotels.filter(h => selectedHotels.has(h.id));
        if (selected.length === 0) return;

        setIsSearching(true);
        let addedCount = 0;

        for (const hotel of selected) {
            try {
                const response = await fetch('/api/find-email', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ query: hotel.name })
                });
                const data = await response.json();
                if (data.emails && data.emails.length > 0) {
                    const firstEmail = data.emails[0];
                    setHotelEmails(prev => {
                        if (!prev.includes(firstEmail)) {
                            addedCount++;
                            return [...prev, firstEmail];
                        }
                        return prev;
                    });
                }
            } catch (e) {
                console.error(`Failed to fetch email for ${hotel.name}`, e);
            }
        }

        setIsSearching(false);
        setFetchedHotels([]);
        setSelectedHotels(new Set());

        toast({
            title: 'Processing complete',
            description: `Found and added ${addedCount} emails from selected hotels.`,
            status: addedCount > 0 ? 'success' : 'warning',
            duration: 4000,
            isClosable: true,
        });
    };

    const handleSearchEmail = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!hotelQuery) return;

        setIsSearching(true);
        try {
            // First check if it's already an email
            if (hotelQuery.includes('@') && !hotelQuery.startsWith('http') && hotelQuery.includes('.')) {
                if (!hotelEmails.includes(hotelQuery)) {
                    setHotelEmails([...hotelEmails, hotelQuery]);
                }
                setHotelQuery('');
                setIsSearching(false);
                return;
            }

            let searchQuery = hotelQuery;

            // Check if it is a generic booking.com search url
            if (hotelQuery.includes('booking.com/searchresults')) {
                setBookingUrl(hotelQuery);
                setHtmlContent('');
                onOpen();
                setIsSearching(false);
                return;
            }

            // Check if it is a booking.com url
            if (hotelQuery.includes('booking.com/hotel/')) {
                try {
                    let extractedName = '';
                    let detailsExtracted = false;

                    const urlObj = new URL(hotelQuery.startsWith('http') ? hotelQuery : `https://${hotelQuery}`);
                    const match = urlObj.pathname.match(/\/hotel\/[a-zA-Z0-9-]+\/([^.]+)/);
                    if (match && match[1]) {
                        extractedName = match[1].split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
                        searchQuery = extractedName;
                    }

                    // Booking.com can have params in hash or search, sometimes separated by semicolons
                    const paramSource = (urlObj.search || urlObj.hash || '').replace(/;/g, '&');
                    const paramString = paramSource.startsWith('?') || paramSource.startsWith('#') ? paramSource.substring(1) : paramSource;
                    const searchParams = new URLSearchParams(paramString);

                    const checkin = searchParams.get('checkin');
                    const checkout = searchParams.get('checkout');
                    const groupAdults = searchParams.get('group_adults');

                    if (checkin && checkout) {
                        setStartDate(new Date(checkin));
                        setEndDate(new Date(checkout));
                        detailsExtracted = true;
                    }

                    if (groupAdults) {
                        setGuestCount(Number(groupAdults));
                        detailsExtracted = true;
                    }

                    if (extractedName && detailsExtracted) {
                        toast({
                            title: 'Booking.com details extracted!',
                            description: `Found hotel: ${extractedName}, along with dates/guests.`,
                            status: 'success',
                            duration: 4000,
                            isClosable: true,
                        });
                    } else if (extractedName) {
                        toast({
                            title: 'Hotel name extracted',
                            description: `Found hotel: ${extractedName}`,
                            status: 'info',
                            duration: 3000,
                            isClosable: true,
                        });
                    }
                } catch (e) {
                    console.error("Failed to parse booking.com URL", e);
                }
            }

            // Otherwise, search for it
            const response = await fetch('/api/find-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query: searchQuery })
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

    const handleManualScrape = async () => {
        setIsScraping(true);
        try {
            const fetchRes = await fetch('/api/fetch-booking', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ html: htmlContent })
            });

            const fetchData = await fetchRes.json();

            if (fetchRes.ok && fetchData.hotels && fetchData.hotels.length > 0) {
                setFetchedHotels(fetchData.hotels);
                toast({
                    title: 'Hotels found',
                    description: `Found ${fetchData.hotels.length} hotels. You can now select them.`,
                    status: 'success',
                    duration: 4000,
                    isClosable: true,
                });
                onClose();
            } else {
                toast({
                    title: 'Extraction Failed',
                    description: fetchData.error || 'Could not extract any hotels from this HTML.',
                    status: 'warning',
                    duration: 5000,
                    isClosable: true,
                });
            }
        } catch (e) {
            console.error("Failed to extract booking search results", e);
            toast({
                title: 'Error',
                description: 'Failed to extract booking.com results.',
                status: 'error',
                duration: 3000,
                isClosable: true,
            });
        } finally {
            setIsScraping(false);
            setHotelQuery('');
        }
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

            <Modal isOpen={isOpen} onClose={onClose} size="xl">
                <ModalOverlay />
                <ModalContent bg="white">
                    <ModalHeader>Manual Booking.com Extraction</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        <Stack spacing={4}>
                            <Text>Since automated scraping is often blocked by Captchas, you can extract the data manually:</Text>
                            <Box pl={4}>
                                <ol className="list-decimal space-y-2">
                                    <li>Open this link in a new tab: <a href={bookingUrl} target="_blank" rel="noopener noreferrer" className="text-teal-600 underline">Booking.com Search</a></li>
                                    <li>Complete any Captchas if they appear and let the search results load.</li>
                                    <li>Press <kbd className="bg-gray-100 border px-1 rounded">Ctrl+U</kbd> (or <kbd className="bg-gray-100 border px-1 rounded">Cmd+Option+U</kbd> on Mac) to view the page source.</li>
                                    <li>Press <kbd className="bg-gray-100 border px-1 rounded">Ctrl+A</kbd> then <kbd className="bg-gray-100 border px-1 rounded">Ctrl+C</kbd> to copy all the HTML.</li>
                                    <li>Paste the copied HTML into the box below:</li>
                                </ol>
                            </Box>
                            <Textarea
                                placeholder="Paste HTML here..."
                                value={htmlContent}
                                onChange={(e) => setHtmlContent(e.target.value)}
                                rows={6}
                                size="sm"
                            />
                        </Stack>
                    </ModalBody>

                    <ModalFooter>
                        <Button variant="ghost" mr={3} onClick={onClose}>
                            Cancel
                        </Button>
                        <Button colorScheme="teal" onClick={handleManualScrape} isLoading={isScraping} isDisabled={!htmlContent}>
                            Extract Hotels
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>

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

                    {fetchedHotels.length > 0 && (
                        <Box bg="blue.50" p={4} borderRadius="md" borderWidth={1} borderColor="blue.100">
                            <Heading as="h3" size="sm" mb={3} color="blue.800">Fetched Hotels ({fetchedHotels.length}):</Heading>
                            <Stack spacing={2} maxHeight="300px" overflowY="auto" mb={3}>
                                {fetchedHotels.map((hotel) => (
                                    <HStack key={hotel.id} justify="space-between" bg="white" p={3} borderRadius="sm" borderWidth={1}>
                                        <Checkbox
                                            isChecked={selectedHotels.has(hotel.id)}
                                            onChange={() => handleToggleHotelSelection(hotel.id)}
                                            colorScheme="teal"
                                        >
                                            <Box ml={2}>
                                                <Text fontWeight="bold" fontSize="sm">{hotel.name}</Text>
                                                <HStack spacing={4} mt={1}>
                                                    <Text fontSize="xs" color="gray.600">Price: {hotel.price}</Text>
                                                    <Text fontSize="xs" color="gray.600">Review: {hotel.review}</Text>
                                                </HStack>
                                            </Box>
                                        </Checkbox>
                                    </HStack>
                                ))}
                            </Stack>
                            <Button
                                colorScheme="blue"
                                size="sm"
                                onClick={handleProcessSelectedHotels}
                                isLoading={isSearching}
                                isDisabled={selectedHotels.size === 0}
                                width="full"
                            >
                                Find Emails for Selected Hotels ({selectedHotels.size})
                            </Button>
                        </Box>
                    )}

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
