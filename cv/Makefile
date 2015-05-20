all:
	pdflatex cv_with_ref
	pdflatex cv_with_ref
	mv cv_with_ref.pdf cv.pdf
	pdflatex "\def\genrefs{0} \input{cv_with_ref.tex}"
	pdflatex "\def\genrefs{0} \input{cv_with_ref.tex}"

clean:
	rm -f *~ *.aux *.out *.log
