import React, { useState } from 'react';
import { Form, InputGroup, Button } from 'react-bootstrap';
import { BsSearch } from 'react-icons/bs';

interface SearchBarProps {
  onSearch: (query: string) => void;
}

const SearchBar: React.FC<SearchBarProps> = ({ onSearch }) => {
  const [query, setQuery] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(query);
  };

  return (
    <Form onSubmit={handleSubmit}>
      <InputGroup>
        <Form.Control
          placeholder="Search tasks..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <Button variant="outline-secondary" type="submit">
          <BsSearch />
        </Button>
      </InputGroup>
    </Form>
  );
};

export default SearchBar;
