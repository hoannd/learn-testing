# Test submitting a form to httpbin

## Test Case: Submit Form to httpbin

Navigate to the httpbin form page

* Navigate to "env:HTTPBIN_FORM_URL"

Fill in the form fields

* Enter "John Doe" into the "custname" field

* Enter "john@example.com" into the "custemail" field

* Enter "1234567890" into the "custtel" field

* Check "cheese" checkbox for "topping"

* Select "medium" radio button for "size"

* Enter "No onions please" into the "comments" field

Submit the form

* Click the "Submit order" button

Verify the response

* The response should contain "John Doe"

* The response should contain "john@example.com"

* The response should contain "cheese"

* The response should contain "medium"

* The response should contain "No onions please"
