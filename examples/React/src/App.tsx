import {useEffect, useState} from 'react';
import {DateRangeOption, dateRangeOptionPresets} from '@genspectrum/dashboard-components/util';
import '@genspectrum/dashboard-components/components';
import '@genspectrum/dashboard-components/style.css';

function App() {
    const [location, setLocation] = useState({
        region: 'Europe',
        country: 'Switzerland',
    });
    const [dateRange, setDateRange] = useState({
        dateFrom: '2021-01-01',
        dateTo: '2021-12-31',
    });

    useEffect(() => {
        const handleLocationChange = (event: CustomEvent) => setLocation(event.detail);
        const handleDateRangeChange = (
            event: CustomEvent<{
                dateFrom: string;
                dateTo: string;
            }>,
        ) => setDateRange(event.detail);

        const locationFilter = document.querySelector('gs-location-filter');
        if (locationFilter) {
            locationFilter.addEventListener('gs-location-changed', handleLocationChange);
        }

        const dateRangeSelector = document.querySelector('gs-date-range-selector');
        if (dateRangeSelector) {
            dateRangeSelector.addEventListener('gs-date-range-filter-changed', handleDateRangeChange);
        }

        return () => {
            if (locationFilter) {
                locationFilter.removeEventListener('gs-location-changed', handleLocationChange);
            }
            if (dateRangeSelector) {
                dateRangeSelector.removeEventListener('gs-date-range-filter-changed', handleDateRangeChange);
            }
        };
    }, []);

    const denominator = {
        ...dateRange,
        ...location,
    };

    const numerator = {
        displayName: 'My variant',
        lapisFilter: {
            ...denominator,
            pangoLineage: 'B.1.1.7*',
        },
    };

    const dataRangeOptions = [
        dateRangeOptionPresets.allTimes,
        dateRangeOptionPresets.last6Months,
        dateRangeOptionPresets.lastMonth,
        {label: '2020', dateFrom: '2020-01-01', dateTo: '2020-12-31'},
        {label: '2021', dateFrom: '2021-01-01', dateTo: '2021-12-31'},
        {label: '2022', dateFrom: '2022-01-01', dateTo: '2022-12-31'},
    ] satisfies DateRangeOption[];

    return (
        <gs-app lapis='https://lapis.cov-spectrum.org/open/v2/'>
            <gs-location-filter
                value={JSON.stringify({
                    region: 'Europe',
                    country: 'Switzerland',
                })}
                fields='["region", "country", "division", "location"]'
                placeholderText='Enter a location'
            ></gs-location-filter>
            <gs-date-range-selector
                dateRangeOptions={JSON.stringify(dataRangeOptions)}
                value={JSON.stringify(dateRange)}
                lapisDateField='date'
            ></gs-date-range-selector>
            <div style={{display: 'flex', flexDirection: 'row'}}>
                <div>
                    <h1 className='text-xl bold'>Prevalence over time</h1>
                    <gs-prevalence-over-time
                        numeratorFilters={JSON.stringify([numerator])}
                        denominatorFilter={JSON.stringify(denominator)}
                        lapisDateField='date'
                        granularity='day'
                        smoothingWindow='7'
                        views='["line", "table"]'
                        width='800px'
                        height='300px'
                    ></gs-prevalence-over-time>
                </div>
                <div style={{height: '300px', width: '1000px'}}>
                    <h1 className='text-xl bold'>Prevalence over time</h1>
                    <gs-prevalence-over-time
                        numeratorFilters={JSON.stringify([numerator])}
                        denominatorFilter={JSON.stringify(denominator)}
                        lapisDateField='date'
                        granularity='day'
                        smoothingWindow='7'
                        views='["line", "table"]'
                        width='80%'
                        height='100%'
                    ></gs-prevalence-over-time>
                </div>
            </div>
            <h1 className='text-xl bold'>Prevalence over time</h1>
            <div>
                <gs-prevalence-over-time
                    numeratorFilters={JSON.stringify([numerator])}
                    denominatorFilter={JSON.stringify(denominator)}
                    lapisDateField='date'
                    granularity='day'
                    smoothingWindow='7'
                    views='["line", "table"]'
                ></gs-prevalence-over-time>
            </div>
            <h1 className='text-xl bold'>Relative Growth Advantage</h1>
            <gs-relative-growth-advantage
                numeratorFilter={JSON.stringify(numerator.lapisFilter)}
                denominatorFilter={JSON.stringify(denominator)}
                lapisDateField='date'
                generationTime='7'
                views='["line"]'
                width='100%'
                height='700px'
            ></gs-relative-growth-advantage>
            <gs-mutations-over-time
                lapisFilter={JSON.stringify(numerator.lapisFilter)}
                sequenceType='nucleotide'
                views='["grid"]'
                width='100%'
                height='700px'
                granularity='week'
                lapisDateField='date'
            ></gs-mutations-over-time>
        </gs-app>
    );
}

export default App;
