# Events

Service for managing custom events

## Development practices

[See client README](../client/src/v2-events/README.md)

## Glossary

[See client GLOSSARY](../client/src/v2-events/GLOSSARY.md)

## Styleguide

[See client STYLEGUIDE](../client/src/v2-events/STYLEGUIDE.md)

## Testing

- Each endpoint should be tested
- Global test setup expects [tennis-club-membership-event fixture](../commons/src/fixtures/tennis-club-membership-event.ts) to be returned from country-configuration
- Test generators rely on [tennis-club-membership-event fixture](../commons/src/fixtures/tennis-club-membership-event.ts) to dynamically generate action data (validation is performed based on the dynamic configuration)
