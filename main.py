#!/usr/bin/env python3

import sys
import re


def eprint(*args, **kwargs):
    '''Same as print() but to stderr. Useful for debugging.'''
    print(*args, file=sys.stderr, **kwargs)


def find_nth(haystack, needle, n):
    '''Find nth occurrence of a substring in a string.'''
    start = haystack.find(needle)
    while start >= 0 and n > 1:
        start = haystack.find(needle, start + len(needle))
        n -= 1
    return start


def filter_areas(filename):
    with open(filename) as f:
        next(f)
        print('origin_census_block_group,destination_cbgs')

        for row in f:
            start = find_nth(row, '{', 4)
            end = row.find('}', start)
            destination_cbgs = row[start:end + 1]
            if '"36061' in destination_cbgs:
                print(row[:13] + destination_cbgs)


def main():
    {
        '-filter': filter_areas
    }[sys.argv[1]](sys.argv[2])


if __name__ == '__main__':
    main()
