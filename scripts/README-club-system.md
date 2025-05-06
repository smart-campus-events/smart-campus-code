# Club System Documentation

## Data Import Process

The clubs data was imported from the UH Manoa Approved RIOs Google Sheet using the script `scripts/fetch-clubs-from-published-sheet.js`. This script directly accesses the published Google Sheet and imports all the club data into the database, creating categories as needed.

After the import, we cleaned up the categories using the `scripts/clean-club-categories.js` script, which merged similar categories and removed incorrectly imported categories.

## Current Status

The system now contains:
- 244 clubs imported from the UH Manoa Approved RIOs Google Sheet
- 15 normalized categories

## How to Use the Clubs API

### Getting All Clubs

```
GET /api/clubs
```

Returns all clubs with pagination (default limit is 1000).

### Filtering by Category

```
GET /api/clubs?category={categoryId}
```

**Important**: You must use the category ID, not the category name. 

To get the category ID, first call the categories API:

```
GET /api/categories
```

Then use the ID from the response in your clubs query:

```
GET /api/clubs?category=cmacbmrbh00001ohrmvnxld9c
```

### Searching for Clubs

```
GET /api/clubs?q={searchTerm}
```

This will search in both the club name and purpose fields.

### Sorting Clubs

```
GET /api/clubs?sort=A-Z
GET /api/clubs?sort=Z-A
```

### Pagination

```
GET /api/clubs?page=1&limit=20
```

## Example API Calls

List all clubs (paginated):
```
curl "http://localhost:3000/api/clubs?limit=20"
```

Search for clubs:
```
curl "http://localhost:3000/api/clubs?q=engineering"
```

Filter by category (get category ID first):
```
curl "http://localhost:3000/api/categories"
curl "http://localhost:3000/api/clubs?category=cmacbmrbh00001ohrmvnxld9c"
```

## Maintenance

### Adding New Clubs

New clubs can be added through the API:

```
POST /api/clubs
```

Or directly in the database using scripts similar to `scripts/add-sample-clubs.js`.

### Running New Imports

If the Google Sheet is updated, you can run the import script again:

```
node scripts/fetch-clubs-from-published-sheet.js
```

This will update existing clubs and add new ones.

### Common Category IDs

For reference, here are the IDs of common categories:

- Academic/Professional: cmacbmrbh00001ohrmvnxld9c
- Ethnic/Cultural: cmacbmrdu000z1ohrellpmyao
- Religious/Spiritual: cmacbmrcq000h1ohr0h3j541i
- Service: cmacbmrce00061ohr7va1jz4j
- Sport/Leisure: cmacbmrcc00041ohr16ele233 