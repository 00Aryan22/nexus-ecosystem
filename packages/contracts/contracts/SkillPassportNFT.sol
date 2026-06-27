// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

/**
 * @title  SkillPassportNFT
 * @notice Soulbound (non-transferable) ERC-721 Skill Passport for NEXUS AI.
 *
 *  Rules
 *  ------
 *  - Each wallet may own at most ONE passport (enforced on mint).
 *  - Tokens are soulbound: all transfers are blocked except mint/burn.
 *  - Only accounts with ISSUER_ROLE can mint.
 *  - Only accounts with ADMIN_ROLE can burn (revoke) a passport.
 *  - The token URI can be updated by ISSUER_ROLE (to re-pin metadata on IPFS).
 *
 *  Events
 *  ------
 *  - PassportMinted(uint256 tokenId, address wallet, string metadataUri)
 *  - PassportUpdated(uint256 tokenId, string newMetadataUri)
 *  - PassportRevoked(uint256 tokenId, address wallet)
 */
contract SkillPassportNFT is ERC721, AccessControl {
    using Strings for uint256;

    // ─── Roles ───────────────────────────────────────────────────────────────
    bytes32 public constant ADMIN_ROLE  = keccak256("ADMIN_ROLE");
    bytes32 public constant ISSUER_ROLE = keccak256("ISSUER_ROLE");

    // ─── State ───────────────────────────────────────────────────────────────
    uint256 private _nextTokenId;

    /// tokenId → IPFS metadata URI
    mapping(uint256 => string) private _tokenURIs;

    /// wallet address → tokenId (0 means no passport)
    mapping(address => uint256) private _walletToToken;

    /// tokenId → owner (kept separately to allow lookup after burn)
    mapping(uint256 => address) private _tokenToWallet;

    // ─── Events ──────────────────────────────────────────────────────────────
    event PassportMinted(uint256 indexed tokenId, address indexed wallet, string metadataUri);
    event PassportUpdated(uint256 indexed tokenId, string newMetadataUri);
    event PassportRevoked(uint256 indexed tokenId, address indexed wallet);

    // ─── Constructor ─────────────────────────────────────────────────────────
    constructor(address admin) ERC721("NexusSkillPassport", "NSP") {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(ADMIN_ROLE, admin);
        _grantRole(ISSUER_ROLE, admin);
        _nextTokenId = 1; // start IDs at 1; 0 is the "no passport" sentinel
    }

    // ─── Mint ────────────────────────────────────────────────────────────────
    /**
     * @notice Mint a soulbound passport for `wallet`.
     * @dev    Reverts if the wallet already owns a passport.
     */
    function mint(address wallet, string calldata metadataUri)
        external
        onlyRole(ISSUER_ROLE)
        returns (uint256 tokenId)
    {
        require(_walletToToken[wallet] == 0, "SkillPassportNFT: wallet already has a passport");
        require(bytes(metadataUri).length > 0, "SkillPassportNFT: empty metadata URI");

        tokenId = _nextTokenId++;
        _safeMint(wallet, tokenId);
        _tokenURIs[tokenId]     = metadataUri;
        _walletToToken[wallet]  = tokenId;
        _tokenToWallet[tokenId] = wallet;

        emit PassportMinted(tokenId, wallet, metadataUri);
    }

    // ─── Update Metadata ─────────────────────────────────────────────────────
    /**
     * @notice Update the IPFS metadata URI for an existing token (e.g. after
     *         new skills are added and metadata is re-pinned).
     */
    function updateMetadata(uint256 tokenId, string calldata newMetadataUri)
        external
        onlyRole(ISSUER_ROLE)
    {
        require(_ownerOf(tokenId) != address(0), "SkillPassportNFT: token does not exist");
        require(bytes(newMetadataUri).length > 0, "SkillPassportNFT: empty metadata URI");

        _tokenURIs[tokenId] = newMetadataUri;
        emit PassportUpdated(tokenId, newMetadataUri);
    }

    // ─── Revoke (burn) ────────────────────────────────────────────────────────
    /**
     * @notice Admin-only burn. Clears wallet→token mapping so the wallet could
     *         receive a new passport in the future.
     */
    function revoke(uint256 tokenId) external onlyRole(ADMIN_ROLE) {
        address owner = _ownerOf(tokenId);
        require(owner != address(0), "SkillPassportNFT: token does not exist");

        _walletToToken[owner]    = 0;
        _tokenToWallet[tokenId]  = address(0);
        _burn(tokenId);

        emit PassportRevoked(tokenId, owner);
    }

    // ─── Lookups ─────────────────────────────────────────────────────────────
    /**
     * @notice Return the tokenId owned by `wallet`, or 0 if none.
     */
    function tokenOfWallet(address wallet) external view returns (uint256) {
        return _walletToToken[wallet];
    }

    /**
     * @notice Return the wallet address that owns `tokenId`.
     */
    function walletOfToken(uint256 tokenId) external view returns (address) {
        return _tokenToWallet[tokenId];
    }

    /**
     * @notice ERC-721 tokenURI override.
     */
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(_ownerOf(tokenId) != address(0), "SkillPassportNFT: token does not exist");
        return _tokenURIs[tokenId];
    }

    // ─── Soulbound enforcement ────────────────────────────────────────────────
    /**
     * @dev Block all transfers except mint (from == address(0)) and
     *      burn (to == address(0)).
     */
    function _update(
        address to,
        uint256 tokenId,
        address auth
    ) internal override returns (address) {
        address from = _ownerOf(tokenId);
        require(
            from == address(0) || to == address(0),
            "SkillPassportNFT: soulbound - transfers disabled"
        );
        return super._update(to, tokenId, auth);
    }

    // ─── Interface support ────────────────────────────────────────────────────
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
