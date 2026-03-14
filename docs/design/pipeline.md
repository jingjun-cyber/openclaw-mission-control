# Content Pipeline — Design Doc

## Data model
- `contentItems` table stores stage, channel, owner, dates, and content fields.

## Indexes
- by_project, by_stage, by_targetDate

## UI
- `/pipeline` provides stage overview; detail page edits per item.
