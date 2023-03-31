# Bithomp-submit

A tool to decode or/and submit offline signed xrpl transaction.

## Online version

https://bithomp.github.io/bithomp-submit/

## Standalone version

Download `index.html`

Open the file in a browser by double clicking it.

This can be compiled from source using the command `python compile.py`

## Usage

Submit the data and wait for a result.

## for devs without python

`brew install python`

`echo "alias python=/usr/bin/python3" >> ~/.zshrc`

## Making changes

Please do not make modifications to `index.html`, since they will
be overwritten by `compile.py`.

Make changes in `src/*`.

Changes are applied during release using the command `python compile.py`, so
please do not commit changes to `index.html`

## Open-source

This project is 100% open-source code

Get the source code from the repository - https://github.com/Bithomp/bithomp-submit

## Libraries

Lodash - https://github.com/lodash/lodash

ripple-lib  - https://github.com/ripple/ripple-lib

instascan - https://github.com/schmich/instascan

decodeXrplTx - https://github.com/Bithomp/decodeXrplTx

## License

2023 Bithomp AB All Rights Reserved

The software is provided "as is", without warranty of any kind, express or implied, including but not limited to the warranties of merchantability, fitness for a particular purpose and noninfringement. In no event shall the authors or copyright holders be liable for any claim, damages or other liability, whether in an action of contract, tort or otherwise, arising from, out of or in connection with the software or the use or other dealings in the software.

Please refer to the software license for more details.

https://github.com/Bithomp/bithomp-submit/blob/master/LICENSE
