{
  inputs.nixpkgs.url = "github:NixOS/nixpkgs/nixos-24.05";
  inputs.flake-utils.url = "github:numtide/flake-utils";

  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachDefaultSystem (system:
      let pkgs = import nixpkgs {
        inherit system;
        config = { allowUnfree = true; };
      };
      in {
        devShell = pkgs.mkShell {
          buildInputs = with pkgs; [
            nodejs_20
	          python3
            sqlite
          ];
          shellHook = ""
            npm install
          "";
        };
      });
}
