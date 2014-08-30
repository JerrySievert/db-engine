# DB Engine

A conceptual database engine toolkit, including a query language, indexes, and storage.

## Concepts

*DB Engine* is a key/value store, where the value is a `JSON` object.  It has the ability to store, index, and query data.

### Querying the Database

There are two methods that *DB Engine* uses to query the data held by it: _Indexes_, and _Full Table Scans_.

_Full Table Scans_ do just what it sounds like, they scan through the whole store, making comparisons.  _Full Table Scans_ use the following comparison mechanisms:

* `equals` - checks for equality
* `gt` - greater than
* `gte` - greater than or equal
* `lt` - less than
* `lte` - less than or equal
* `between` - lies in between or equal to

In addition, _Indexes_ allow for faster queries, and are keyed against a single field in the data.

_Indexes_ can expose other query operations for additional types of queries.  This allows for expansion of other types of data and operations with the simple addition of an index.

#### Query Languages

*DB Engine* at the most basic level uses a `tree` based query language.  Other query languages can be parsed and coerced into this form for consumption, including the built-in query language that is part of *DB Engine*.

Queries are built in `JSON`, and are descriptive.

```js
{
  operand: "equals",
  key: "foo",
  value: "bar"
}
```

In this example, an equality check is done against the value contained in the `foo` field.  If it matches with equality, then the result is returned.

```js
{
  "foo": "bar",
  "baz": [
    1,
    2,
    3
  ]
}
```

This object would be matched.

#### Built-in Query Language

In addition, there is a built-in query language that is more semantic.

```js
{
  "foo": "bar"
}
```

Parses out to:

```js
{
  operand: "equals",
  key: "foo",
  value: "bar"
}
```

As does:

```js
{
  "foo": {
    equals: "bar"
  }
}
```

Queries can have complex logic.  When a query is using `and` or `or`, it allows for boolean logic:

```js
{
  "$and": [
    {
      "$or": [
        {
          "name": {
            "equals": "Main"
          }
        },
        {
          "crime.type": {
            "equals": "Arson"
          }
        }
      ]
    },
    {
      "date": {
        "between": [ '2013-11-30', '2014-01-01' ]
      }
    }
  ]
}
```

This query finds any object that has a `name` field of "Main", plus any objects that have a `crime.type` of "Arson".  The results of those are compared to the results of any objects that have a `date` between "2013-11-30" and "2014-01-01".

This query would parse to:

```js
{
  operand: "$and",
  value: [
    {
      operand: "$or",
      value: [
        {
          operand: "equals",
          key: "name",
          value: "Main"
        },
        {
          operand: "equals",
          key: "crime.type",
          value: "Arson"
        }
      ]
    },
    {
      operand: "between",
      key: "date",
      value: [ '2013-11-30', '2014-01-01' ]
    }
  ]
}
```
