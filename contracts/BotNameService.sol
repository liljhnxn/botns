// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title BotNameService
 * @notice Decentralized Domain Name Service for the Botchain Network (.bot)
 * @dev Supports registration, renewal, multi-record resolution, reverse resolution, and subdomains.
 */
contract BotNameService {
    string public constant TLD = "bot";

    address public owner;
    bool public paused;

    // Pricing in wei (native BOT token) per year
    uint256 public price1to2Chars = 50 ether;  // 50 BOT / yr
    uint256 public price3Chars    = 20 ether;  // 20 BOT / yr
    uint256 public price4Chars    = 10 ether;  // 10 BOT / yr
    uint256 public price5Plus     = 2 ether;   // 2 BOT / yr

    uint256 public constant SECONDS_PER_YEAR = 365 days;
    uint256 public constant GRACE_PERIOD = 30 days;

    struct Domain {
        string name;            // e.g. "satoshit" (without .bot)
        address owner;          // Current domain controller / owner
        address resolvedAddress;// Resolved EVM wallet address
        uint256 registeredAt;   // First registration timestamp
        uint256 expiresAt;      // Expiry timestamp
        string contentHash;     // IPFS / Arweave CID or website hash
        bool exists;
    }

    struct Subdomain {
        address resolvedAddress;
        bool exists;
    }

    // Name hash -> Domain details
    mapping(bytes32 => Domain) public domains;

    // Name hash -> (key -> text record value) e.g., "avatar", "com.twitter", "email"
    mapping(bytes32 => mapping(string => string)) private textRecords;

    // Subdomain hash (keccak256(sub.domain.bot)) -> Subdomain info
    mapping(bytes32 => Subdomain) public subdomains;

    // Reverse Resolution: Wallet Address -> Primary .bot Domain Name
    mapping(address => string) public reverseRecords;

    // User address -> list of registered domain names
    mapping(address => string[]) private userRegisteredDomains;

    // Total domains registered
    uint256 public totalDomainsRegistered;

    // Events
    event DomainRegistered(
        string indexed name,
        bytes32 indexed nameHash,
        address indexed owner,
        address resolvedAddress,
        uint256 expiresAt,
        uint256 cost
    );
    event DomainRenewed(
        string indexed name,
        bytes32 indexed nameHash,
        uint256 newExpiresAt,
        uint256 cost
    );
    event DomainTransferred(
        string indexed name,
        bytes32 indexed nameHash,
        address indexed previousOwner,
        address newOwner
    );
    event AddressRecordChanged(
        string indexed name,
        bytes32 indexed nameHash,
        address newResolvedAddress
    );
    event TextRecordChanged(
        string indexed name,
        bytes32 indexed nameHash,
        string key,
        string value
    );
    event ContentHashChanged(
        string indexed name,
        bytes32 indexed nameHash,
        string contentHash
    );
    event SubdomainCreated(
        string indexed parentName,
        string indexed subLabel,
        string fullSubdomain,
        address resolvedAddress
    );
    event PrimaryNameSet(
        address indexed user,
        string name
    );

    modifier onlyOwner() {
        require(msg.sender == owner, "Only contract owner can call");
        _;
    }

    modifier whenNotPaused() {
        require(!paused, "Contract is currently paused");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    // --- Pricing & Calculation ---

    function getPrice(string memory name, uint256 durationYears) public view returns (uint256) {
        require(durationYears >= 1, "Duration must be at least 1 year");
        uint256 len = bytes(name).length;
        require(len > 0, "Name cannot be empty");

        uint256 annualPrice;
        if (len <= 2) {
            annualPrice = price1to2Chars;
        } else if (len == 3) {
            annualPrice = price3Chars;
        } else if (len == 4) {
            annualPrice = price4Chars;
        } else {
            annualPrice = price5Plus;
        }

        return annualPrice * durationYears;
    }

    function getNameHash(string memory name) public pure returns (bytes32) {
        return keccak256(abi.encodePacked(_toLowerCase(name)));
    }

    function isAvailable(string memory name) public view returns (bool) {
        bytes32 nameHash = getNameHash(name);
        Domain memory d = domains[nameHash];
        if (!d.exists) return true;
        // Available if expired and past grace period
        return block.timestamp > (d.expiresAt + GRACE_PERIOD);
    }

    // --- Core Registration ---

    function register(
        string memory name,
        address targetAddress,
        uint256 durationYears
    ) external payable whenNotPaused {
        string memory cleanName = _toLowerCase(name);
        bytes32 nameHash = keccak256(abi.encodePacked(cleanName));
        require(bytes(cleanName).length >= 1, "Name too short");
        _validateNameCharacters(cleanName);

        require(isAvailable(cleanName), "Domain is not available");

        uint256 requiredCost = getPrice(cleanName, durationYears);
        require(msg.value >= requiredCost, "Insufficient BOT sent for registration");

        address resolved = targetAddress == address(0) ? msg.sender : targetAddress;
        uint256 expiry = block.timestamp + (durationYears * SECONDS_PER_YEAR);

        domains[nameHash] = Domain({
            name: cleanName,
            owner: msg.sender,
            resolvedAddress: resolved,
            registeredAt: block.timestamp,
            expiresAt: expiry,
            contentHash: "",
            exists: true
        });

        userRegisteredDomains[msg.sender].push(cleanName);
        totalDomainsRegistered++;

        // Set as primary name if user doesn't have one
        if (bytes(reverseRecords[msg.sender]).length == 0) {
            reverseRecords[msg.sender] = cleanName;
            emit PrimaryNameSet(msg.sender, cleanName);
        }

        // Refund any excess payment
        if (msg.value > requiredCost) {
            payable(msg.sender).transfer(msg.value - requiredCost);
        }

        emit DomainRegistered(cleanName, nameHash, msg.sender, resolved, expiry, requiredCost);
    }

    function renew(string memory name, uint256 durationYears) external payable whenNotPaused {
        string memory cleanName = _toLowerCase(name);
        bytes32 nameHash = keccak256(abi.encodePacked(cleanName));
        Domain storage d = domains[nameHash];
        require(d.exists, "Domain does not exist");
        require(block.timestamp <= (d.expiresAt + GRACE_PERIOD), "Domain expired past grace period");

        uint256 requiredCost = getPrice(cleanName, durationYears);
        require(msg.value >= requiredCost, "Insufficient BOT for renewal");

        if (d.expiresAt < block.timestamp) {
            // Already inside grace period: extend from now
            d.expiresAt = block.timestamp + (durationYears * SECONDS_PER_YEAR);
        } else {
            // Extend from current expiration
            d.expiresAt += (durationYears * SECONDS_PER_YEAR);
        }

        if (msg.value > requiredCost) {
            payable(msg.sender).transfer(msg.value - requiredCost);
        }

        emit DomainRenewed(cleanName, nameHash, d.expiresAt, requiredCost);
    }

    // --- Record Management ---

    function setResolvedAddress(string memory name, address newResolvedAddress) external {
        string memory cleanName = _toLowerCase(name);
        bytes32 nameHash = keccak256(abi.encodePacked(cleanName));
        Domain storage d = domains[nameHash];
        require(d.owner == msg.sender, "Caller is not domain owner");
        require(block.timestamp <= d.expiresAt, "Domain is expired");

        d.resolvedAddress = newResolvedAddress;
        emit AddressRecordChanged(cleanName, nameHash, newResolvedAddress);
    }

    function setTextRecord(string memory name, string memory key, string memory value) external {
        string memory cleanName = _toLowerCase(name);
        bytes32 nameHash = keccak256(abi.encodePacked(cleanName));
        Domain storage d = domains[nameHash];
        require(d.owner == msg.sender, "Caller is not domain owner");
        require(block.timestamp <= d.expiresAt, "Domain is expired");

        textRecords[nameHash][key] = value;
        emit TextRecordChanged(cleanName, nameHash, key, value);
    }

    function setContentHash(string memory name, string memory hashValue) external {
        string memory cleanName = _toLowerCase(name);
        bytes32 nameHash = keccak256(abi.encodePacked(cleanName));
        Domain storage d = domains[nameHash];
        require(d.owner == msg.sender, "Caller is not domain owner");
        require(block.timestamp <= d.expiresAt, "Domain is expired");

        d.contentHash = hashValue;
        emit ContentHashChanged(cleanName, nameHash, hashValue);
    }

    function transferDomain(string memory name, address newOwner) external {
        require(newOwner != address(0), "Invalid new owner");
        string memory cleanName = _toLowerCase(name);
        bytes32 nameHash = keccak256(abi.encodePacked(cleanName));
        Domain storage d = domains[nameHash];
        require(d.owner == msg.sender, "Caller is not domain owner");

        address prevOwner = d.owner;
        d.owner = newOwner;
        userRegisteredDomains[newOwner].push(cleanName);

        emit DomainTransferred(cleanName, nameHash, prevOwner, newOwner);
    }

    // --- Subdomains ---

    function createSubdomain(
        string memory parentName,
        string memory subLabel,
        address resolvedAddress
    ) external {
        string memory cleanParent = _toLowerCase(parentName);
        string memory cleanSub = _toLowerCase(subLabel);
        bytes32 parentHash = keccak256(abi.encodePacked(cleanParent));
        Domain storage d = domains[parentHash];
        require(d.owner == msg.sender, "Caller is not parent domain owner");
        require(block.timestamp <= d.expiresAt, "Parent domain is expired");

        string memory fullSubdomain = string(abi.encodePacked(cleanSub, ".", cleanParent));
        bytes32 subHash = keccak256(abi.encodePacked(fullSubdomain));

        subdomains[subHash] = Subdomain({
            resolvedAddress: resolvedAddress == address(0) ? msg.sender : resolvedAddress,
            exists: true
        });

        emit SubdomainCreated(cleanParent, cleanSub, fullSubdomain, resolvedAddress);
    }

    // --- Reverse Resolution ---

    function setPrimaryName(string memory name) external {
        string memory cleanName = _toLowerCase(name);
        bytes32 nameHash = keccak256(abi.encodePacked(cleanName));
        Domain memory d = domains[nameHash];
        require(d.owner == msg.sender, "Must own domain to set as primary");
        require(block.timestamp <= d.expiresAt, "Domain is expired");

        reverseRecords[msg.sender] = cleanName;
        emit PrimaryNameSet(msg.sender, cleanName);
    }

    // --- View Functions ---

    function resolve(string memory name) external view returns (
        address resolvedAddress,
        address currentOwner,
        uint256 expiresAt,
        bool isExpired,
        string memory contentHash
    ) {
        bytes32 nameHash = getNameHash(name);
        Domain memory d = domains[nameHash];
        require(d.exists, "Domain not found");
        bool expired = block.timestamp > d.expiresAt;
        return (d.resolvedAddress, d.owner, d.expiresAt, expired, d.contentHash);
    }

    function getTextRecord(string memory name, string memory key) external view returns (string memory) {
        bytes32 nameHash = getNameHash(name);
        return textRecords[nameHash][key];
    }

    function resolveSubdomain(string memory fullSubdomain) external view returns (address, bool) {
        bytes32 subHash = keccak256(abi.encodePacked(_toLowerCase(fullSubdomain)));
        Subdomain memory sub = subdomains[subHash];
        return (sub.resolvedAddress, sub.exists);
    }

    function getUserDomains(address user) external view returns (string[] memory) {
        return userRegisteredDomains[user];
    }

    function getDomainDetails(string memory name) external view returns (
        string memory domainName,
        address domainOwner,
        address resolvedAddress,
        uint256 registeredAt,
        uint256 expiresAt,
        string memory contentHash,
        bool available
    ) {
        bytes32 nameHash = getNameHash(name);
        Domain memory d = domains[nameHash];
        bool avail = isAvailable(name);
        return (d.name, d.owner, d.resolvedAddress, d.registeredAt, d.expiresAt, d.contentHash, avail);
    }

    // --- Admin Functions ---

    function setPrices(uint256 _price1to2, uint256 _price3, uint256 _price4, uint256 _price5Plus) external onlyOwner {
        price1to2Chars = _price1to2;
        price3Chars = _price3;
        price4Chars = _price4;
        price5Plus = _price5Plus;
    }

    function withdraw() external onlyOwner {
        payable(owner).transfer(address(this).balance);
    }

    function setPaused(bool _paused) external onlyOwner {
        paused = _paused;
    }

    // --- Internal Helpers ---

    function _toLowerCase(string memory str) internal pure returns (string memory) {
        bytes memory bStr = bytes(str);
        bytes memory bLower = new bytes(bStr.length);
        for (uint i = 0; i < bStr.length; i++) {
            if ((uint8(bStr[i]) >= 65) && (uint8(bStr[i]) <= 90)) {
                bLower[i] = bytes1(uint8(bStr[i]) + 32);
            } else {
                bLower[i] = bStr[i];
            }
        }
        return string(bLower);
    }

    function _validateNameCharacters(string memory str) internal pure {
        bytes memory b = bytes(str);
        for (uint i = 0; i < b.length; i++) {
            bytes1 char = b[i];
            bool isLower = (char >= 0x61 && char <= 0x7a); // a-z
            bool isDigit = (char >= 0x30 && char <= 0x39); // 0-9
            bool isHyphen = (char == 0x2d); // '-'
            require(isLower || isDigit || isHyphen, "Domain contains invalid characters");
        }
    }
}
