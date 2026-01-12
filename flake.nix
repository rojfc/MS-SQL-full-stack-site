{
  description = "NainBeClab site develop shell";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-25.05";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        shellPrompt = "node-js-shell";
        
        pkgs = import nixpkgs {
          inherit system;
        };

        # Choose version of nodejs (don't compile because no "distutils")
        # buildNodeJs = pkgs.callPackage "${<nixpkgs>}/pkgs/development/web/nodejs/nodejs.nix" {
        #   python = pkgs.python3;
        # };
        #
        # nodejs = buildNodeJs {
        #   enableNpm = true;
        #   version = "20.5.1";
        #   sha256 = "sha256-Q5xxqi84woYWV7+lOOmRkaVxJYBmy/1FSFhgScgTQZA=";
        # };
      in rec {
        flakedPkgs = pkgs;
        devShell = pkgs.mkShellNoCC {
          # Customization
          shellHook = ''
            export PROMPT_NAME=${shellPrompt}
            echo "Welcome to node.js develop shell!"
            exec fish
          '';

          # add things you want in your shell here
          buildInputs = with pkgs; [
            nodejs
            docker-compose
            #node
            #npm
            #npx
          ];
        };
      }
    );
}
