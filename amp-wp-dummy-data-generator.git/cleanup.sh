# setup.sh
#!/bin/bash



set -x
set -e

plugin_dir="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"

wp rewrite flush
wp cache flush

#wp comment delete $(wp comment list --format=ids) --force
#wp menu delete $(wp menu list --format=ids)


post_types=$(wp post-type list --field=name | xargs echo $1)

IFS=' ' # space is set as delimiter
read -ra post_type_array <<< "$post_types" # str is read into an array as tokens separated by IFS

for post_type in "${post_type_array[@]}"; do # access each element of array
    wp post delete $(wp post list --post_type=$post_type --format=ids) --force
done

taxonomies=$(wp taxonomy list --field=name | xargs echo $1)

IFS=' ' # space is set as delimiter
read -ra taxonomy_array <<< "$taxonomies" # str is read into an array as tokens separated by IFS

for taxonomy in "${taxonomy_array[@]}"; do # access each element of array
    wp term list $taxonomy --field=term_id | xargs wp term delete $taxonomy
done

wp widget reset --all
wp user delete $(wp user list --field=ID)
wp transient delete --all




