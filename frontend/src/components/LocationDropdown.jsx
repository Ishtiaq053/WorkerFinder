/**
 * LocationDropdown
 * Structured location selection: Country → City → Sub-area (optional)
 * Builds a consistent location string: "Sub-area, City, Country" or "City, Country"
 */
import { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import './LocationDropdown.css';

const LOCATION_DATA = {
  'Pakistan': {
    'Lahore': [
      'DHA', 'Gulberg', 'Model Town', 'Johar Town', 'Township', 'Bahria Town',
      'Iqbal Town', 'Garden Town', 'Cantt', 'Wapda Town', 'Shadman',
      'New Garden Town', 'Allama Iqbal Town', 'Raiwind Road', 'Ferozepur Road',
      'Samanabad', 'Ichra', 'Manga Mandi'
    ],
    'Karachi': [
      'DHA', 'Clifton', 'Gulshan-e-Iqbal', 'North Nazimabad', 'PECHS',
      'Bahria Town', 'Malir', 'Korangi', 'Lyari', 'Saddar', 'Orangi Town', 'Landhi'
    ],
    'Islamabad': [
      'F-6', 'F-7', 'F-8', 'F-10', 'F-11', 'G-9', 'G-10', 'G-11', 'G-13',
      'E-7', 'E-11', 'Blue Area', 'DHA', 'Bahria Town', 'PWD', 'I-8', 'I-10'
    ],
    'Rawalpindi': [
      'Saddar', 'Chaklala', 'Bahria Town', 'DHA', 'Satellite Town', 'Wah Cantt'
    ],
    'Faisalabad': [
      'Civil Lines', 'Gulberg', 'Madina Town', 'Millat Town', 'Peoples Colony'
    ],
    'Multan': [
      'Shah Rukn-e-Alam', 'Cantt', 'Old Multan', 'New Multan', 'Gulgasht Colony'
    ],
    'Peshawar': ['Hayatabad', 'University Town', 'Cantt', 'Saddar'],
    'Quetta': ['Satellite Town', 'Cantt', 'Jinnah Town'],
    'Sialkot': ['Cantt', 'Sialkot City', 'Wazirabad'],
    'Gujranwala': ['Gujranwala City', 'Satellite Town'],
    'Bahawalpur': ['Bahawalpur City', 'Cantt'],
    'Sargodha': ['Sargodha City', 'University Road']
  },
  'United Arab Emirates': {
    'Dubai': [
      'Deira', 'Downtown Dubai', 'Dubai Marina', 'JBR', 'Business Bay',
      'Silicon Oasis', 'Bur Dubai', 'Karama', 'Jumeirah'
    ],
    'Abu Dhabi': ['Al Reem Island', 'Khalidiyah', 'Corniche', 'Mussaffah', 'Al Ain'],
    'Sharjah': ['Al Nahda', 'Rolla', 'Industrial Area'],
    'Ajman': ['Ajman City', 'Al Jurf']
  },
  'United Kingdom': {
    'London': [
      'East London', 'West London', 'North London', 'South London',
      'Central London', 'Canary Wharf', 'Croydon'
    ],
    'Manchester': ['City Centre', 'Salford', 'Trafford', 'Didsbury'],
    'Birmingham': ['City Centre', 'Edgbaston', 'Sparkhill'],
    'Glasgow': ['City Centre', 'West End'],
    'Leeds': ['City Centre', 'Headingley']
  },
  'Saudi Arabia': {
    'Riyadh': ['Al Olaya', 'Al Malaz', 'King Fahd District', 'Al Sulimaniyah'],
    'Jeddah': ['Al Hamra', 'Al Rawdah', 'Corniche', 'Al Balad'],
    'Makkah': ['Aziziyah', 'Al Azizia', 'Misfalah'],
    'Madinah': ['Al Aqeeq', 'Al Haram']
  },
  'Canada': {
    'Toronto': ['Downtown', 'North York', 'Scarborough', 'Etobicoke', 'Mississauga'],
    'Vancouver': ['Downtown', 'Burnaby', 'Surrey', 'Richmond'],
    'Calgary': ['Downtown', 'NW Calgary', 'SE Calgary']
  },
  'Australia': {
    'Sydney': ['CBD', 'North Shore', 'Western Sydney', 'Inner West'],
    'Melbourne': ['CBD', 'South Melbourne', 'Fitzroy'],
    'Brisbane': ['CBD', 'South Brisbane', 'Fortitude Valley']
  }
};

const parseValue = (val) => {
  if (!val || !val.trim()) return { country: '', city: '', subArea: '' };
  const parts = val.split(',').map((p) => p.trim());
  if (parts.length >= 3) {
    return { subArea: parts[0], city: parts[1], country: parts[2] };
  }
  if (parts.length === 2) {
    return { country: parts[1], city: parts[0], subArea: '' };
  }
  return { country: parts[0] || '', city: '', subArea: '' };
};

const buildLocation = (country, city, subArea) => {
  if (!country || !city) return '';
  return subArea ? `${subArea}, ${city}, ${country}` : `${city}, ${country}`;
};

export default function LocationDropdown({
  value = '',
  onChange,
  error = '',
  required = false,
  label = 'Location'
}) {
  const initial = parseValue(value);
  const [country, setCountry] = useState(initial.country);
  const [city, setCity] = useState(initial.city);
  const [subArea, setSubArea] = useState(initial.subArea);
  const prevValueRef = useRef(value);

  // Sync internal state when parent resets value to ''
  useEffect(() => {
    if (value === '' && prevValueRef.current !== '') {
      setCountry('');
      setCity('');
      setSubArea('');
    }
    prevValueRef.current = value;
  }, [value]);

  const countries = Object.keys(LOCATION_DATA);
  const cities = country ? Object.keys(LOCATION_DATA[country] || {}) : [];
  const subAreas = country && city ? LOCATION_DATA[country]?.[city] || [] : [];

  const handleCountryChange = (e) => {
    const newCountry = e.target.value;
    setCountry(newCountry);
    setCity('');
    setSubArea('');
    onChange(''); // Wait for city before emitting a valid value
  };

  const handleCityChange = (e) => {
    const newCity = e.target.value;
    setCity(newCity);
    setSubArea('');
    onChange(buildLocation(country, newCity, ''));
  };

  const handleSubAreaChange = (e) => {
    const newSubArea = e.target.value;
    setSubArea(newSubArea);
    onChange(buildLocation(country, city, newSubArea));
  };

  const hasError = !!error;

  return (
    <div className="location-dropdown-wrapper">
      {label && (
        <label className="wf-form-label">
          {label} {required && <span className="text-danger">*</span>}
        </label>
      )}

      {/* Country */}
      <select
        className={`form-select wf-form-control mb-2 ${hasError && !country ? 'is-invalid' : ''}`}
        value={country}
        onChange={handleCountryChange}
      >
        <option value="">— Select Country —</option>
        {countries.map((c) => (
          <option key={c} value={c}>{c}</option>
        ))}
      </select>

      {/* City — shown once country is selected */}
      {country && (
        <select
          className={`form-select wf-form-control mb-2 ${hasError && !city ? 'is-invalid' : ''}`}
          value={city}
          onChange={handleCityChange}
        >
          <option value="">— Select City —</option>
          {cities.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      )}

      {/* Sub-area — shown only for cities that have sub-areas */}
      {country && city && subAreas.length > 0 && (
        <select
          className="form-select wf-form-control mb-2"
          value={subArea}
          onChange={handleSubAreaChange}
        >
          <option value="">— Select Area / Locality (Optional) —</option>
          {subAreas.map((a) => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>
      )}

      {error && (
        <div className="wf-validation-error">
          <i className="bi bi-exclamation-circle-fill me-1"></i>{error}
        </div>
      )}
    </div>
  );
}

LocationDropdown.propTypes = {
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  error: PropTypes.string,
  required: PropTypes.bool,
  label: PropTypes.string
};
