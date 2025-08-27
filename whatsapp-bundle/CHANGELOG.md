# WhatsApp Integration Changelog

## [2.0.0] - 2024-08-27

### Added
- Complete WhatsApp Business API integration
- Multi-tenant support with organization isolation
- Interactive message types (buttons, lists)
- Staff and customer intent recognition
- Real-time dashboard for conversation management
- Debug endpoints for troubleshooting
- Comprehensive test suite

### Fixed
- Dashboard query logic to properly display messages
- Organization ID filtering in all database queries
- Message storage with required fields
- Build errors with missing dependencies

### Changed
- Updated to use HERA universal 6-table architecture
- Improved error handling and logging
- Enhanced security with webhook verification
- Better multi-language support structure

## [1.0.0] - 2024-08-26

### Initial Release
- Basic webhook implementation
- Message receiving capability
- Simple text responses
- Database storage in universal tables