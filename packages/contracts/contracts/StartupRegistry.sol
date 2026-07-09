// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

contract StartupRegistry is AccessControl {
    using Strings for uint256;

    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");

    struct Startup {
        address founder;
        string name;
        string industry;
        string metadataUri;
        uint256 registeredAt;
        uint256 updatedAt;
        bool exists;
    }

    uint256 private _nextStartupId;

    mapping(uint256 => Startup) private _startups;
    mapping(address => uint256[]) private _founderProjects;
    mapping(string => bool) private _nameReserved;

    event StartupRegistered(uint256 indexed id, address indexed founder, string name, string industry);
    event StartupUpdated(uint256 indexed id, string name, string metadataUri);
    event StartupVerified(uint256 indexed id);

    constructor(address admin) {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(ADMIN_ROLE, admin);
        _nextStartupId = 1;
    }

    function registerStartup(
        string calldata name,
        string calldata industry,
        string calldata metadataUri
    ) external returns (uint256 id) {
        require(bytes(name).length > 0, "StartupRegistry: name cannot be empty");
        require(!_nameReserved[name], "StartupRegistry: name already reserved");

        id = _nextStartupId++;
        _startups[id] = Startup({
            founder: msg.sender,
            name: name,
            industry: industry,
            metadataUri: metadataUri,
            registeredAt: block.timestamp,
            updatedAt: block.timestamp,
            exists: true
        });
        _founderProjects[msg.sender].push(id);
        _nameReserved[name] = true;

        emit StartupRegistered(id, msg.sender, name, industry);
    }

    function updateStartup(
        uint256 id,
        string calldata name,
        string calldata metadataUri
    ) external {
        require(_startups[id].exists, "StartupRegistry: startup does not exist");
        require(_startups[id].founder == msg.sender, "StartupRegistry: not the founder");

        if (keccak256(bytes(name)) != keccak256(bytes(_startups[id].name))) {
            require(!_nameReserved[name], "StartupRegistry: name already reserved");
            _nameReserved[_startups[id].name] = false;
            _nameReserved[name] = true;
        }

        _startups[id].name = name;
        _startups[id].metadataUri = metadataUri;
        _startups[id].updatedAt = block.timestamp;

        emit StartupUpdated(id, name, metadataUri);
    }

    function getStartup(uint256 id) external view returns (Startup memory) {
        require(_startups[id].exists, "StartupRegistry: startup does not exist");
        return _startups[id];
    }

    function listFounderProjects(address founder) external view returns (uint256[] memory) {
        return _founderProjects[founder];
    }

    function getStartupCount() external view returns (uint256) {
        return _nextStartupId - 1;
    }
}
