#!/usr/bin/env python3

import orjson
import sys
import re


def eprint(*args, **kwargs):
    '''Same as print() but to stderr. Useful for debugging.'''
    print(*args, file=sys.stderr, **kwargs)


def main():
    {
        'cmd': True
    }[sys.argv[1]]


if __name__ == '__main__':
    main()
